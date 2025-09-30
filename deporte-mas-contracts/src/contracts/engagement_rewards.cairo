use starknet::ContractAddress;

// ===============================
// Activity Type Enum
// ===============================

#[derive(Drop, Serde, starknet::Store, PartialEq, Copy, Hash)]
#[allow(starknet::store_no_default_variant)]
enum ActivityType {
    StreamWatch,
    ChatParticipation,
    PollCompletion,
    VODWatch,
    ContentShare,
    ReferralSuccess,
    CourseCompletion,
    PredictionCorrect,
    None,
}

// ===============================
// Engagement Rewards Interface
// ===============================

#[starknet::interface]
trait IEngagementRewards<TContractState> {
    fn reward_activity(ref self: TContractState, user: ContractAddress, activity: ActivityType, proof: Array<felt252>);
    fn batch_reward(ref self: TContractState, users: Array<ContractAddress>, activities: Array<ActivityType>);
    fn set_activity_reward(ref self: TContractState, activity: ActivityType, reward: u256);
    fn check_daily_limit(self: @TContractState, user: ContractAddress, activity: ActivityType) -> u256;
    fn get_activity_reward(self: @TContractState, activity: ActivityType) -> u256;
    fn get_daily_activity_count(self: @TContractState, user: ContractAddress, activity: ActivityType) -> u256;
    fn get_deporte_points(self: @TContractState) -> ContractAddress;
    fn get_membership_nft(self: @TContractState) -> ContractAddress;
}

// ===============================
// Engagement Rewards Contract
// ===============================

#[starknet::contract]
mod EngagementRewards {
    use openzeppelin::access::ownable::OwnableComponent;
    use starknet::{ContractAddress, get_block_timestamp};
    use starknet::storage::{StoragePointerWriteAccess, StoragePointerReadAccess, Map, StorageMapReadAccess, StorageMapWriteAccess};
    use super::{IEngagementRewards, ActivityType};

    // Dispatchers
    use crate::contracts::membership_nft::{IMembershipNFTDispatcher, IMembershipNFTDispatcherTrait};
    use crate::contracts::deportesmas_erc20::{IDeportesMasPointsDispatcher, IDeportesMasPointsDispatcherTrait};

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
        activity_rewards: Map<ActivityType, u256>,
        daily_limits: Map<ActivityType, u256>,
        daily_activity_count: Map<(ContractAddress, ActivityType, u64), u256>,
        last_activity_timestamp: Map<(ContractAddress, ActivityType), u64>,
        cooldown_periods: Map<ActivityType, u64>,
    }

    // ===============================
    // Events
    // ===============================

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        ActivityRewarded: ActivityRewarded,
        BatchRewarded: BatchRewarded,
        ActivityRewardUpdated: ActivityRewardUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct ActivityRewarded {
        user: ContractAddress,
        activity: ActivityType,
        amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct BatchRewarded {
        user_count: u256,
        total_amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ActivityRewardUpdated {
        activity: ActivityType,
        new_reward: u256,
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
        
        self.activity_rewards.write(ActivityType::StreamWatch, 200);
        self.activity_rewards.write(ActivityType::ChatParticipation, 5);
        self.activity_rewards.write(ActivityType::PollCompletion, 25);
        self.activity_rewards.write(ActivityType::VODWatch, 10);
        self.activity_rewards.write(ActivityType::ContentShare, 20);
        self.activity_rewards.write(ActivityType::ReferralSuccess, 2000);
        self.activity_rewards.write(ActivityType::CourseCompletion, 500);
        self.activity_rewards.write(ActivityType::PredictionCorrect, 100);
        
        self.daily_limits.write(ActivityType::StreamWatch, 1);
        self.daily_limits.write(ActivityType::ChatParticipation, 10);
        self.daily_limits.write(ActivityType::PollCompletion, 1);
        self.daily_limits.write(ActivityType::VODWatch, 100);
        self.daily_limits.write(ActivityType::ContentShare, 1);
        self.daily_limits.write(ActivityType::ReferralSuccess, 0);
        self.daily_limits.write(ActivityType::CourseCompletion, 0);
        self.daily_limits.write(ActivityType::PredictionCorrect, 0);
        
        self.cooldown_periods.write(ActivityType::StreamWatch, 3600);
        self.cooldown_periods.write(ActivityType::ChatParticipation, 300);
        self.cooldown_periods.write(ActivityType::PollCompletion, 3600);
        self.cooldown_periods.write(ActivityType::VODWatch, 600);
        self.cooldown_periods.write(ActivityType::ContentShare, 3600);
        self.cooldown_periods.write(ActivityType::ReferralSuccess, 0);
        self.cooldown_periods.write(ActivityType::CourseCompletion, 0);
        self.cooldown_periods.write(ActivityType::PredictionCorrect, 0);
    }

    // ===============================
    // External
    // ===============================

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    
    #[abi(embed_v0)]
    impl EngagementRewardsImpl of IEngagementRewards<ContractState> {
        fn reward_activity(ref self: ContractState, user: ContractAddress, activity: ActivityType, proof: Array<felt252>) {
            self.ownable.assert_only_owner();
            
            let membership_nft = self.membership_nft.read();
            let membership_status = IMembershipNFTDispatcher { contract_address: membership_nft }.get_membership_status(user);
            assert!(membership_status, "User has no active membership");
            
            let last_activity = self.last_activity_timestamp.read((user, activity));
            let current_timestamp = get_block_timestamp();
            let cooldown = self.cooldown_periods.read(activity);
            
            if cooldown > 0 {
                assert!(current_timestamp >= last_activity + cooldown, "Activity on cooldown");
            }
            
            let daily_limit = self.daily_limits.read(activity);
            if daily_limit > 0 {
                let today = current_timestamp / 86400;
                let today_count = self.daily_activity_count.read((user, activity, today));
                assert!(today_count < daily_limit, "Daily limit exceeded");
                
                self.daily_activity_count.write((user, activity, today), today_count + 1);
            }
            
            let reward_amount = self.activity_rewards.read(activity);
            
            let deporte_points = self.deporte_points.read();
            IDeportesMasPointsDispatcher { contract_address: deporte_points }.mint(user, reward_amount);
            
            self.last_activity_timestamp.write((user, activity), current_timestamp);
            
            self.emit(ActivityRewarded {
                user,
                activity,
                amount: reward_amount,
                timestamp: current_timestamp,
            });
        }

        fn batch_reward(ref self: ContractState, users: Array<ContractAddress>, activities: Array<ActivityType>) {
            self.ownable.assert_only_owner();
            
            let users_len = users.len();
            let activities_len = activities.len();
            assert!(users_len == activities_len, "Arrays length mismatch");
            
            let mut total_amount: u256 = 0;
            let current_timestamp = get_block_timestamp();
            let membership_nft = self.membership_nft.read();
            let deporte_points = self.deporte_points.read();
            
            let mut i = 0;
            while i < users_len {
                let user = *users.at(i);
                let activity = *activities.at(i);
                
                let membership_status = IMembershipNFTDispatcher { contract_address: membership_nft }.get_membership_status(user);
                if !membership_status {
                    i += 1;
                    continue;
                }
                
                let last_activity = self.last_activity_timestamp.read((user, activity));
                let cooldown = self.cooldown_periods.read(activity);
                
                if cooldown > 0 && current_timestamp < last_activity + cooldown {
                    i += 1;
                    continue;
                }
                
                let daily_limit = self.daily_limits.read(activity);
                if daily_limit > 0 {
                    let today = current_timestamp / 86400;
                    let today_count = self.daily_activity_count.read((user, activity, today));
                    if today_count >= daily_limit {
                        i += 1;
                        continue;
                    }
                    
                    // Update daily count
                    self.daily_activity_count.write((user, activity, today), today_count + 1);
                }
                
                let reward_amount = self.activity_rewards.read(activity);
                IDeportesMasPointsDispatcher { contract_address: deporte_points }.mint(user, reward_amount);
                total_amount += reward_amount;
                
                self.last_activity_timestamp.write((user, activity), current_timestamp);
                
                i += 1;
            };
            
            self.emit(BatchRewarded {
                user_count: users_len.into(),
                total_amount,
                timestamp: current_timestamp,
            });
        }

        fn set_activity_reward(ref self: ContractState, activity: ActivityType, reward: u256) {
            self.ownable.assert_only_owner();
            
            self.activity_rewards.write(activity, reward);
            
            self.emit(ActivityRewardUpdated {
                activity,
                new_reward: reward,
                timestamp: get_block_timestamp(),
            });
        }

        fn check_daily_limit(self: @ContractState, user: ContractAddress, activity: ActivityType) -> u256 {
            let daily_limit = self.daily_limits.read(activity);
            if daily_limit == 0 {
                return 0;
            }
            
            let current_timestamp = get_block_timestamp();
            let today = current_timestamp / 86400;
            let today_count = self.daily_activity_count.read((user, activity, today));
            
            if today_count >= daily_limit {
                0
            } else {
                daily_limit - today_count
            }
        }

        fn get_activity_reward(self: @ContractState, activity: ActivityType) -> u256 {
            self.activity_rewards.read(activity)
        }

        fn get_daily_activity_count(self: @ContractState, user: ContractAddress, activity: ActivityType) -> u256 {
            let current_timestamp = get_block_timestamp();
            let today = current_timestamp / 86400;
            self.daily_activity_count.read((user, activity, today))
        }

        fn get_deporte_points(self: @ContractState) -> ContractAddress {
            self.deporte_points.read()
        }

        fn get_membership_nft(self: @ContractState) -> ContractAddress {
            self.membership_nft.read()
        }
    }
}
