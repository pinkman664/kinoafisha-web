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
exports.Session = void 0;
const typeorm_1 = require("typeorm");
const Movie_1 = require("./Movie");
const Hall_1 = require("./Hall");
const Ticket_1 = require("./Ticket");
let Session = class Session {
};
exports.Session = Session;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Session.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Movie_1.Movie, (movie) => movie.sessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'movieId' }),
    __metadata("design:type", Movie_1.Movie)
], Session.prototype, "movie", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Hall_1.Hall, (hall) => hall.sessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hallId' }),
    __metadata("design:type", Hall_1.Hall)
], Session.prototype, "hall", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'startTime',
        type: 'timestamp',
        precision: 6,
    }),
    __metadata("design:type", Date)
], Session.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'endTime',
        type: 'timestamp',
        precision: 6,
        nullable: true,
    }),
    __metadata("design:type", Date)
], Session.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Session.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vipMultiplier', type: 'number', precision: 5, scale: 2, nullable: true, default: 1.5 }),
    __metadata("design:type", Number)
], Session.prototype, "vipMultiplier", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Ticket_1.Ticket, (ticket) => ticket.session, { cascade: true }),
    __metadata("design:type", Array)
], Session.prototype, "tickets", void 0);
exports.Session = Session = __decorate([
    (0, typeorm_1.Entity)('sessions')
], Session);
//# sourceMappingURL=Session.js.map