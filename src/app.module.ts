import {MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TagModule} from './tag/tag.module';
import {UserModule} from './user/user.module';
import ormConfig from "./ormconfig";
import {AuthMiddleware} from "./user/middlewares/auth.middleware";
import { ArticleModule } from './article/article.module';
import { ProfileModule } from './profile/profile.module';

@Module({
    imports: [TypeOrmModule.forRoot(ormConfig), TagModule, UserModule, ArticleModule, ProfileModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes({
            path: "*",
            method: RequestMethod.ALL
        })
    }
}
