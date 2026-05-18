"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movie = void 0;
const typeorm_1 = require("typeorm");
const Genre_1 = require("./Genre");
const Session_1 = require("./Session");
const Comment_1 = require("./Comment");
const Rating_1 = require("./Rating");
let Movie = class Movie {
};
exports.Movie = Movie;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Movie.prototype, "movieId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Movie.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 400, nullable: true }),
    __metadata("design:type", String)
], Movie.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 500, nullable: true }),
    __metadata("design:type", String)
], Movie.prototype, "coverImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 3, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], Movie.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 5, scale: 0, nullable: true }),
    __metadata("design:type", Number)
], Movie.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Movie.prototype, "releaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Movie.prototype, "ageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar2', length: 500, nullable: true }),
    __metadata("design:type", String)
], Movie.prototype, "trailer", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Genre_1.Genre, (genre) => genre.movies),
    (0, typeorm_1.JoinTable)({
        name: 'moviegenres',
        joinColumn: { name: 'movieId', referencedColumnName: 'movieId' },
        inverseJoinColumn: { name: 'genreId', referencedColumnName: 'genreId' },
    }),
    __metadata("design:type", Array)
], Movie.prototype, "genres", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Session_1.Session, (session) => session.movie, { cascade: true }),
    __metadata("design:type", Array)
], Movie.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Comment_1.Comment, (comment) => comment.movie, { cascade: true }),
    __metadata("design:type", Array)
], Movie.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Rating_1.Rating, (rating) => rating.movie, { cascade: true }),
    __metadata("design:type", Array)
], Movie.prototype, "ratings", void 0);
exports.Movie = Movie = __decorate([
    (0, typeorm_1.Entity)('movies')
], Movie);
//# sourceMappingURL=Movie.js.map