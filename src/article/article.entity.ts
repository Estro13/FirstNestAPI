import {BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {UserEntity} from "../user/user.entity";
import {IsNotEmpty} from "class-validator";


@Entity({name: 'articles'})
export class ArticleEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    slug: string;

    @Column()
    title: string;

    @Column({default: ''})
    description: string;

    @Column({default: ''})
    body: string;

    @Column({type: 'timestamp', default: ()=> 'CURRENT_TIMESTAMP'})
    createAt: Date;

    @Column({type: 'timestamp', default: ()=> 'CURRENT_TIMESTAMP'})
    updateAt: Date;


    @Column('simple-array')
    tagList: string[];

    @Column({default: 0})
    favoritesCount: number;

    @BeforeUpdate()
    updateTimeStamp() {
        this.updateAt = new Date();
    }

    @ManyToOne(()=> UserEntity, user => user.articles, {eager:true} )
    author: UserEntity;
}
// {eager:true} -ми вказуєм що при получене в сервісі нащого article(поста) ми получаємо з ним автора цього поста щоб порівняти чи це його пост(наприклад для видалення)