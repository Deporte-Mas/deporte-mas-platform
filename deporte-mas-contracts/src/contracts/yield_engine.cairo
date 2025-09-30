use starknet::ContractAddress;

// ===============================
// Yield Engine Interface
// ===============================

#[starknet::interface]
trait IYieldEngine<TContractState> {
    fn calculate_daily_yield(self: @TContractState, user: ContractAddress) -> u256;
    fn distribute_yield_batch(ref self: TContractState, users: Array<ContractAddress>);
    fn register_member(ref self: TContractState, user: ContractAddress);
    fn pause_member(ref self: TContractState, user: ContractAddress);
    fn claim_yield(ref self: TContractState);
    fn get_base_daily_yield(self: @TContractState) -> u256;
    fn set_base_daily_yield(ref self: TContractState, base_yield: u256);
    fn get_membership_nft(self: @TContractState) -> ContractAddress;
    fn get_deporte_points(self: @TContractState) -> ContractAddress;
}

// ===============================
// Yield Engine Contract
// ===============================

#[starknet::contract]
mod YieldEngine {
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess, StorageMapWriteAccess};
    use super::IYieldEngine;

    // Dispatchers
    use crate::contracts::membership_nft::{IMembershipNFTDispatcher,IMembershipNFTDispatcherTrait};
    use crate::contracts::deportesmas_erc20::{IDeportesMasPointsDispatcher,IDeportesMasPointsDispatcherTrait};
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ===============================
    // Storage
    // ===============================

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        membership_nft: ContractAddress,
        deporte_points: ContractAddress,
        last_claim_timestamp: Map<ContractAddress, u64>,
        base_daily_yield: u256,
        multiplier_config: Map<u64, u256>,
    }

    // ===============================
    // Events
    // ===============================

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        MemberRegistered: MemberRegistered,
        MemberPaused: MemberPaused,
        YieldDistributed: YieldDistributed,
        YieldClaimed: YieldClaimed,
    }

    #[derive(Drop, starknet::Event)]
    struct MemberRegistered {
        user: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct MemberPaused {
        user: ContractAddress,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct YieldDistributed {
        user: ContractAddress,
        amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct YieldClaimed {
        user: ContractAddress,
        amount: u256,
        timestamp: u64,
    }

    // ===============================
    // Constructor
    // ===============================

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        membership_nft: ContractAddress,
        deporte_points: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.membership_nft.write(membership_nft);
        self.deporte_points.write(deporte_points);
        self.base_daily_yield.write(20);
        self.multiplier_config.write(90, 10);
        self.multiplier_config.write(180, 15);
        self.multiplier_config.write(365, 20);
        self.multiplier_config.write(3650, 30);
    }

    // ===============================
    // External
    // ===============================

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl YieldEngineImpl of IYieldEngine<ContractState> {
        fn calculate_daily_yield(self: @ContractState, user: ContractAddress) -> u256 {
            let membership_nft = self.membership_nft.read();
            let membership_status = IMembershipNFTDispatcher { contract_address: membership_nft }.get_membership_status(user);
            
            if !membership_status {
                return 0;
            }
            
            let last_claim = self.last_claim_timestamp.read(user);
            let current_timestamp = get_block_timestamp();
            
            let time_passed = current_timestamp - last_claim;
            let days_passed_u64 = time_passed / 86400;
            let days_passed = days_passed_u64.into();
            
            if days_passed == 0 {
                return 0;
            }
            
            let base_yield = self.base_daily_yield.read();
            
            let membership_start_date = IMembershipNFTDispatcher { contract_address: membership_nft }.get_membership_start_date(user);
            let membership_duration = current_timestamp - membership_start_date;
            let loyalty_multiplier = self.get_loyalty_multiplier(membership_duration);
            
            let total_yield = (days_passed * base_yield) * loyalty_multiplier / 10;
            
            total_yield
        }

        fn distribute_yield_batch(ref self: ContractState, users: Array<ContractAddress>) {
            self.ownable.assert_only_owner();
            
            let users_len = users.len();
            let mut amounts: Array<u256> = array![];
            let mut i = 0;
            
            while i < users_len {
                let user = *users.at(i);
                let yield_amount = self.calculate_daily_yield(user);
                amounts.append(yield_amount);
                i += 1;
            };
            
            let deporte_points = self.deporte_points.read();
            let users_clone = users.clone();
            IDeportesMasPointsDispatcher { contract_address: deporte_points }.batch_mint(users, amounts);
            let current_timestamp = get_block_timestamp();
            i = 0;
            while i < users_len {
                let user = *users_clone.at(i);
                self.last_claim_timestamp.write(user, current_timestamp);
                i += 1;
            };
        }

        fn register_member(ref self: ContractState, user: ContractAddress) {
            self.ownable.assert_only_owner();
            
            let current_timestamp = get_block_timestamp();
            self.last_claim_timestamp.write(user, current_timestamp);
            
            self.emit(MemberRegistered {
                user,
                timestamp: current_timestamp,
            });
        }

        fn pause_member(ref self: ContractState, user: ContractAddress) {
            self.ownable.assert_only_owner();
            
            let current_timestamp = get_block_timestamp();
            self.last_claim_timestamp.write(user, current_timestamp);
            
            self.emit(MemberPaused {
                user,
                timestamp: current_timestamp,
            });
        }

        fn claim_yield(ref self: ContractState) {
            let caller = get_caller_address();
            
            let membership_nft = self.membership_nft.read();
            let membership_status = IMembershipNFTDispatcher { contract_address: membership_nft }.get_membership_status(caller);
            
            assert!(membership_status, "User has no active membership");
            
            let last_claim = self.last_claim_timestamp.read(caller);
            let current_timestamp = get_block_timestamp();
            
            assert!(current_timestamp >= last_claim + 86400, "Yield not ready yet");
            
            let yield_amount = self.calculate_daily_yield(caller);
            
            if yield_amount > 0 {
                let deporte_points = self.deporte_points.read();
                IDeportesMasPointsDispatcher { contract_address: deporte_points }.mint(caller, yield_amount);
                
                self.last_claim_timestamp.write(caller, current_timestamp);
                
                self.emit(YieldClaimed {
                    user: caller,
                    amount: yield_amount,
                    timestamp: current_timestamp,
                });
            }
        }

        fn get_base_daily_yield(self: @ContractState) -> u256 {
            self.base_daily_yield.read()
        }

        fn set_base_daily_yield(ref self: ContractState, base_yield: u256) {
            self.ownable.assert_only_owner();
            self.base_daily_yield.write(base_yield);
        }

        fn get_membership_nft(self: @ContractState) -> ContractAddress {
            self.membership_nft.read()
        }

        fn get_deporte_points(self: @ContractState) -> ContractAddress {
            self.deporte_points.read()
        }
    }

    // ===============================
    // Internal Functions
    // ===============================

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn get_loyalty_multiplier(self: @ContractState, membership_duration: u64) -> u256 {
            let days = membership_duration / 86400;
            
            if days < 90 {
                self.multiplier_config.read(90)
            } else if days < 180 {
                self.multiplier_config.read(180)
            } else if days < 365 {
                self.multiplier_config.read(365)
            } else {
                self.multiplier_config.read(3650)
            }
        }
    }
}
