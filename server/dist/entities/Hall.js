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
exports.Hall = void 0;
const typeorm_1 = require("typeorm");
const Cinema_1 = require("./Cinema");
const Seat_1 = require("./Seat");
const Session_1 = require("./Session");
let Hall = class Hall {
};
exports.Hall = Hall;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Hall.prototype, "hallId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Cinema_1.Cinema, (cinema) => cinema.halls, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cinemaId' }),
    __metadata("design:type", Cinema_1.Cinema)
], Hall.prototype, "cinema", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Hall.prototype, "hallName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 5, scale: 0, nullable: true }),
    __metadata("design:type", Number)
], Hall.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Seat_1.Seat, (seat) => seat.hall, { cascade: true }),
    __metadata("design:type", Array)
], Hall.prototype, "seats", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Session_1.Session, (session) => session.hall, { cascade: true }),
    __metadata("design:type", Array)
], Hall.prototype, "sessions", void 0);
exports.Hall = Hall = __decorate([
    (0, typeorm_1.Entity)('halls')
], Hall);
//# sourceMappingURL=Hall.js.map