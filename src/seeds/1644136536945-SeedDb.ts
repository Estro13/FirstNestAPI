 import {MigrationInterface, QueryRunner} from "typeorm";

export class SeedDb1644136536945 implements MigrationInterface {
    name = 'SeedDb1644136536945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`);

        //password 1313
        await queryRunner.query(`INSERT INTO users (username, email, password) VALUES ('Yura', 'yurkagospodarishin@ukr.net', '$2b$10$CpefZEpcoxGJSb35BHa7Qu0qLZX1Z0GdexDKsG6v1oAJPCci1HLUq')`);

        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'first article desc', 'first article body', 'coffee,dragons ', 1)`);

        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('second-article', 'Second article', 'second article desc', 'second article body', 'coffee,dragons ', 1)`);
    }
ç
    public async down( ): Promise<void> {}

}
