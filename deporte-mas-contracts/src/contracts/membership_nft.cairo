// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0

use starknet::ContractAddress;

// ===============================
// Membership NFT Interface
// ===============================

#[starknet::interface]
trait IMembershipNFT<TContractState> {
    // Membership functions
    fn mint_membership(ref self: TContractState, user: ContractAddress, tier: u8);
    fn burn_membership(ref self: TContractState, user: ContractAddress);
    fn get_membership_status(self: @TContractState, user: ContractAddress) -> bool;
    fn get_membership_start_date(self: @TContractState, user: ContractAddress) -> u64;
    fn get_loyalty_tier(self: @TContractState, user: ContractAddress) -> u8;
    fn get_yield_engine(self: @TContractState) -> ContractAddress;
    // Yield engine functions
    fn set_yield_engine(ref self: TContractState, yield_engine: ContractAddress);
    fn set_tier(ref self: TContractState, user: ContractAddress, tier: u8);
}

#[derive(Drop, Serde, starknet::Store)]
struct MembershipData {
    start_date: u64,
    tier: u8,
    active: bool,
    token_id: u256,
}

// ===============================
// Membership NFT Contract
// ===============================

#[starknet::contract]
mod MembershipNFT {
    use core::num::traits::Zero;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc721::{ERC721Component, ERC721HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess, StorageMapWriteAccess};
    use super::{IMembershipNFT, MembershipData};
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;


    // ===============================
    // Storage
    // ===============================

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        yield_engine: ContractAddress,
        memberships: Map<ContractAddress, MembershipData>,
        total_active_members: u256,
        next_token_id: u256,
    }

    // ===============================
    // Events
    // ===============================

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    // ===============================
    // Constructor
    // ===============================

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, yield_engine: ContractAddress) {
        self.erc721.initializer("Deportes Mas Subscription", "DMSUB", "");
        self.ownable.initializer(owner);
        self.yield_engine.write(yield_engine);
        self.total_active_members.write(0);
        self.next_token_id.write(1);
    }

    // ===============================
    // External
    // ===============================

    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl MembershipNFTImpl of IMembershipNFT<ContractState> {
        fn mint_membership(ref self: ContractState, user: ContractAddress, tier: u8) {
            self.ownable.assert_only_owner();
            
            let current_timestamp = get_block_timestamp();
            let token_id = self.next_token_id.read();
            self.next_token_id.write(token_id + 1);
            
            let membership_data = MembershipData {
                start_date: current_timestamp,
                tier,
                active: true,
                token_id,
            };
            
            self.memberships.write(user, membership_data);
            
            let current_total = self.total_active_members.read();
            self.total_active_members.write(current_total + 1);
            
            self.erc721.safe_mint(user, token_id, array![].span());
        }

        fn burn_membership(ref self: ContractState, user: ContractAddress) {
            self.ownable.assert_only_owner();
            
            let membership_data = self.memberships.read(user);
            
            let updated_membership = MembershipData {
                start_date: membership_data.start_date,
                tier: membership_data.tier,
                active: false,
                token_id: membership_data.token_id,
            };
            self.memberships.write(user, updated_membership);
            
            let current_total = self.total_active_members.read();
            self.total_active_members.write(current_total - 1);
            
            self.erc721.burn(membership_data.token_id);
        }

        fn get_membership_status(self: @ContractState, user: ContractAddress) -> bool {
            let membership_data = self.memberships.read(user);
            membership_data.active
        }

        fn get_membership_start_date(self: @ContractState, user: ContractAddress) -> u64 {
            let membership_data = self.memberships.read(user);
            membership_data.start_date
        }

        fn get_loyalty_tier(self: @ContractState, user: ContractAddress) -> u8 {
            let membership_data = self.memberships.read(user);
            membership_data.tier
        }

        fn get_yield_engine(self: @ContractState) -> ContractAddress {
            self.yield_engine.read()
        }

        fn set_yield_engine(ref self: ContractState, yield_engine: ContractAddress) {
            self.ownable.assert_only_owner();
            self.yield_engine.write(yield_engine);
        }

        fn set_tier(ref self: ContractState, user: ContractAddress, tier: u8) {
            self.ownable.assert_only_owner();
            let membership_data = self.memberships.read(user);
            let updated_membership = MembershipData {
                start_date: membership_data.start_date,
                tier,
                active: membership_data.active,
                token_id: membership_data.token_id,
            };
            self.memberships.write(user, updated_membership);
        }
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn burn(ref self: ContractState, token_id: u256) {
            self.ownable.assert_only_owner();
            self.erc721.update(Zero::zero(), token_id, get_caller_address());
        }

        #[external(v0)]
        fn safe_mint(
            ref self: ContractState,
            recipient: ContractAddress,
            token_id: u256,
            data: Span<felt252>,
        ) {
            self.ownable.assert_only_owner();
            self.erc721.safe_mint(recipient, token_id, data);
        }

        #[external(v0)]
        fn safeMint(
            ref self: ContractState,
            recipient: ContractAddress,
            tokenId: u256,
            data: Span<felt252>,
        ) {
            self.safe_mint(recipient, tokenId, data);
        }
    }
}
