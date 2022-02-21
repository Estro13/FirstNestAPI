import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {UserEntity} from "../user/user.entity";
import {CreateArticleDto} from "./dto/createArticle.dto";
import {ArticleEntity} from "./article.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DeleteResult, getRepository, Repository} from "typeorm";
import {ArticleResponseInterface} from "./types/articleResponse.interface";
import slugify from "slugify";
import {UpdateArticleDto} from "./dto/updateArticle.dto";
import {ArticlesResponseInterface} from "./types/articlesResponse.interface";
import {FollowEntity} from "../profile/follow.entity";

@Injectable()
export class ArticleService {

    constructor(@InjectRepository(ArticleEntity) private readonly articleRepository: Repository<ArticleEntity>,
                @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
                @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>) { }

    async findAllArticles(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const queryBuilder = getRepository(ArticleEntity)
            .createQueryBuilder('articles')
            .leftJoinAndSelect('articles.author', 'author')

        queryBuilder.orderBy('articles.createAt', "DESC");

        const articlesCount = await queryBuilder.getCount();

        if (query.tag) {
            queryBuilder.andWhere('articles.tagList LIKE :tag', {
                tag: `%${query.tag}%`
            })
        }

        if (query.author) {
            const author = await this.userRepository.findOne({username: query.author})
            queryBuilder.andWhere('articles.authorId = :id', {id: author.id});
        }

        if (query.favorited) {
            const author = await this.userRepository.findOne({username: query.favorited}, {relations: ['favorites']});

            const ids = author.favorites.map((el) => el.id);
            if (ids.length > 0) {
                queryBuilder.andWhere('articles.authorId IN (:...ids)', {ids});
                // ми перевіряєм в кожного article(поста) поле author.id і перевіряєм що цей id знаходиться в масиві наших залайканих айдішніків ids. Ця строка зі всіх постів які в нас є в яких author.id знаходиться в масиві тих постів які залайкав цей юзер
            } else {
                queryBuilder.andWhere('1=0')
                // захист шоб не падав наш сервак коли там буде пустий масив(нуль лайків)а
            }

        }

        if (query.limit) {
            queryBuilder.limit(query.limit)
        }

        if (query.offset) {
            queryBuilder.offset(query.offset)
        }

        let favoriteIds: number[] = [];

        if (currentUserId) {
            const currentUser = await this.userRepository.findOne(currentUserId, {relations: ['favorites']})
            favoriteIds = currentUser.favorites.map((favorite) => favorite.id)
        }
        const articles = await queryBuilder.getMany()
        const articlesWithFavorites = articles.map(article => {
            const favorited = favoriteIds.includes(article.id);
            return {...article, favorited};
        });

        return {articles: articlesWithFavorites, articlesCount};

    }

    async getFeed(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {

        const follows = await this.followRepository.find({followerId: currentUserId})

        if(follows.length === 0) {
            return {articles: [], articlesCount: 0}
        }
        const followingUserIds = follows.map((followEntity) => followEntity.followingId)

        const queryBuilder = getRepository(ArticleEntity).createQueryBuilder('articles').leftJoinAndSelect('articles.author', 'author')
            .where('articles.authorId IN (:...ids)',{ids: followingUserIds})

        queryBuilder.orderBy('articles.createAt', "DESC")

        const articlesCount =  await queryBuilder.getCount()

        if(query.limit) {
            queryBuilder.limit(query.limit)
        }

        if(query.offset) {
            queryBuilder.offset(query.offset )
        }

        const articles = await queryBuilder.getMany()

        return {articles, articlesCount}
    }




    async createArticle(currentUser: UserEntity, createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = new ArticleEntity();
        Object.assign(article, createArticleDto);

        if (!article.tagList) {
            article.tagList = [];
        }

        article.slug = this.getSlug(createArticleDto.title);
        article.author = currentUser;

        return await this.articleRepository.save(article);
    }

    async findBySlug(slug: string): Promise<ArticleEntity> {
        return await this.articleRepository.findOne(slug);
    }

    async deleteArticle(slug: string, currentUserId: number): Promise<DeleteResult> {
        const article = await this.findBySlug(slug)
        if (!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
        }
        return await this.articleRepository.delete(slug)
    }

    async updateArticle(currentUserId: number, slug: string, updateArticleDto: UpdateArticleDto): Promise<ArticleEntity> {
        const article = await this.articleRepository.findOne({slug})

        if (!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
        }

        Object.assign(article, updateArticleDto);
        return await this.articleRepository.save(article);
    }

    async addArticleToFavorites(currentUserId: number, slug: string): Promise<ArticleEntity> {
        const article = await this.articleRepository.findOne({slug})
        const userFromRelations = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })
        const isNotFavorited = userFromRelations.favorites.findIndex((articleInFavorites) => articleInFavorites.id === article.id) === -1;

        if (isNotFavorited) {
            userFromRelations.favorites.push(article);
            article.favoritesCount++;
            await this.userRepository.save(userFromRelations);
            await this.articleRepository.save(article);
        }
        return article;
    }

    async deleteArticleFromFavorites(currentUserId: number, slug: string): Promise<ArticleEntity> {
        const article = await this.articleRepository.findOne({slug})
        console.log(article)
        const userFromRelations = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })

        const articleIndex = userFromRelations.favorites.findIndex((articleInFavorites) => articleInFavorites.id === article.id);


        if (articleIndex >= 0) {
            userFromRelations.favorites.splice(articleIndex, 1)
            article.favoritesCount--;
            await this.userRepository.save(userFromRelations)
            await this.articleRepository.save(article)
        }

        return article;
    }

    buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
        return {article: article}
    }

    private getSlug(title: string): string {
        return slugify(title, {lower: true}) + '-' + ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
    }
}
