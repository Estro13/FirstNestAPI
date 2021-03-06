import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {ProfileType} from "./types/profile.type";
import {ProfileResponseInterface} from "./types/profileResponse.interface";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../user/user.entity";
import {Repository} from "typeorm";
import {FollowEntity} from "./follow.entity";

@Injectable()
export class ProfileService {

    constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
                @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>) {
    }

    buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
        delete profile.email;
        return {profile}
    }

    async getProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
        const userProfile = await this.userRepository.findOne({username: profileUsername})

        if (!userProfile) {
            throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND)
        }

        const follow = await this.followRepository.findOne({
            followerId: currentUserId,
            followingId: userProfile.id
        })

        return {...userProfile, following: Boolean(follow)}
    }

    async followProfile(currentUserId: number, profileUsername: string): Promise<ProfileType> {
        const userProfile = await this.userRepository.findOne({username: profileUsername})

        if (!userProfile) {
            throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND)
        }
        if (currentUserId === userProfile.id) {
            throw new HttpException('Follower and following cant be equal', HttpStatus.BAD_REQUEST)
        }

        const follow = await this.followRepository.findOne({
            followerId: currentUserId,
            followingId: userProfile.id
        })

        if(!follow) {
            const followToCreate = new FollowEntity()
            followToCreate.followerId = currentUserId
            followToCreate.followingId = userProfile.id
            await this.followRepository.save(followToCreate)
        }

        return {...userProfile, following:true }
    }

    async unfollowProfile(currentUserId: number, profileUserName: string): Promise<ProfileType> {

        const userProfile = await this.userRepository.findOne({username: profileUserName,})

        if(!userProfile) {
            throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND)
        }

        if(currentUserId === userProfile.id) {
            throw new HttpException('Follower and following cant be equal', HttpStatus.BAD_REQUEST)
        }

        await this.followRepository.delete({
            followerId: currentUserId,
            followingId: userProfile.id
        })

        return {...userProfile, following: false}
    }
}
