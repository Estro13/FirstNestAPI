import {IsEmail, IsNotEmpty} from "class-validator";


export class UpdateUserDto {

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    bio: string;

    @IsNotEmpty()
    image: string;

}