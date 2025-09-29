// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^2.0.0
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::contract]
mod DeportesMasPoints {
    use openzeppelin::access::accesscontrol::{AccessControlComponent, DEFAULT_ADMIN_ROLE};
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess};
    use super::{MINTER_ROLE};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // External
    #[abi(embed_v0)]
    impl AccessControlMixinImpl = AccessControlComponent::AccessControlMixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;

    // Internal
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        yield_engine: ContractAddress,
        engagement_rewards: ContractAddress,
        giveaway_manager: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress, yield_engine: ContractAddress, engagement_rewards: ContractAddress, giveaway_manager: ContractAddress) {
        self.erc20.initializer("DeportesMasPoints", "DMP");
        self.accesscontrol.initializer();
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, admin);
        self.accesscontrol._grant_role(MINTER_ROLE, yield_engine);
        self.accesscontrol._grant_role(MINTER_ROLE, engagement_rewards);
        self.accesscontrol._grant_role(MINTER_ROLE, giveaway_manager);
        self.yield_engine.write(yield_engine);
        self.engagement_rewards.write(engagement_rewards);
        self.giveaway_manager.write(giveaway_manager);
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn burn(ref self: ContractState, value: u256) {
            self.erc20.burn(get_caller_address(), value);
        }

        #[external(v0)]
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20.mint(recipient, amount);
        }

        #[external(v0)]
        fn batch_mint(ref self: ContractState, recipients: Array<ContractAddress>, amounts: Array<u256>) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            
            let recipients_len = recipients.len();
            let amounts_len = amounts.len();
            assert!(recipients_len == amounts_len, "Arrays length mismatch");
            
            let mut i = 0;
            while i < recipients_len {
                let recipient = *recipients.at(i);
                let amount = *amounts.at(i);
                
                self.erc20.mint(recipient, amount);
                
                i += 1;
            };
        }

        fn get_yield_engine(self: @ContractState) -> ContractAddress {
            self.yield_engine.read()
        }

        fn get_engagement_rewards(self: @ContractState) -> ContractAddress {
            self.engagement_rewards.read()
        }

        fn get_giveaway_manager(self: @ContractState) -> ContractAddress {
            self.giveaway_manager.read()
        }

        fn set_yield_engine(ref self: ContractState, yield_engine: ContractAddress) {
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.accesscontrol._revoke_role(MINTER_ROLE, self.yield_engine.read());
            self.accesscontrol._grant_role(MINTER_ROLE, yield_engine);
            self.yield_engine.write(yield_engine);
        }

        fn set_engagement_rewards(ref self: ContractState, engagement_rewards: ContractAddress) {
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.accesscontrol._revoke_role(MINTER_ROLE, self.engagement_rewards.read());
            self.accesscontrol._grant_role(MINTER_ROLE, engagement_rewards);
            self.engagement_rewards.write(engagement_rewards);
        }

        fn set_giveaway_manager(ref self: ContractState, giveaway_manager: ContractAddress) {
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);
            self.accesscontrol._revoke_role(MINTER_ROLE, self.giveaway_manager.read());
            self.accesscontrol._grant_role(MINTER_ROLE, giveaway_manager);
            self.giveaway_manager.write(giveaway_manager);
        }
    }
}
