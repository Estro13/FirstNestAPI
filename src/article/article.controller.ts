import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {ArticleService} from "./article.service";
import {AuthGuard} from "../user/guards/auth.guard";
import {User} from "../user/decorators/user.decorator";
import {UserEntity} from "../user/user.entity";
import {CreateArticleDto} from "./dto/createArticle.dto";
import {ArticleResponseInterface} from "./types/articleResponse.interface";
import {UpdateArticleDto} from "./dto/updateArticle.dto";
import {ArticlesResponseInterface} from "./types/articlesResponse.interface";

@Controller('articles')
export class ArticleController {

    constructor(private readonly articleService: ArticleService) {}

    @Get()
    async findAllArticles(@User('id') currentUserId: number, @Query() query: any): Promise<ArticlesResponseInterface>{
        return await this.articleService.findAllArticles(currentUserId, query);
    }

    @Get('feed')
    @UseGuards(AuthGuard)
    async getFeed(@User('id') currentUserId: number, @Query() query: any): Promise<ArticlesResponseInterface> {
        return await this.articleService.getFeed(currentUserId, query)
    }

    @Post()
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async createArticle(@User() currentUser: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<ArticleResponseInterface> {
        const article = await this.articleService.createArticle(currentUser, createArticleDto);
        return this.articleService.buildArticleResponse(article)
    }

    @Get(':slug')
    async getSingleArticle(@Param() slug: string): Promise<ArticleResponseInterface>{
        const article = await this.articleService.findBySlug(slug);
        return  this.articleService.buildArticleResponse(article);
    }

    @Delete(':slug')
    @UseGuards(AuthGuard)
    async deleteArticle(@User('id') currentUserId: number, @Param() slug: string) {
        return await this.articleService.deleteArticle(slug, currentUserId)
    }

    @Put(':slug')
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async updateArticle(
        @User('id') currentUserId: number,
        @Param('slug') slug: string,
        @Body('article') updateArticleDto: UpdateArticleDto
    ): Promise<ArticleResponseInterface> {

        const article = await this.articleService.updateArticle(currentUserId, slug, updateArticleDto);
        return this.articleService.buildArticleResponse(article)
    }

    @Post(':slug/favorite')
    @UseGuards(AuthGuard)
    async addArticleToFavorite(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
        const article = await this.articleService.addArticleToFavorites(currentUserId, slug);
        return this.articleService.buildArticleResponse(article);
    }

    @Delete(':slug/favorite')
    @UseGuards(AuthGuard)
    async deleteArticleFromFavorites(@User('id') currentUserId: number, @Param('slug') slug: string): Promise<ArticleResponseInterface> {
        const article = await this.articleService.deleteArticleFromFavorites(currentUserId, slug);
        return this.articleService.buildArticleResponse(article);
    }

}
