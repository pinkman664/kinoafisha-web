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
exports.Seat = void 0;
const typeorm_1 = require("typeorm");
const Hall_1 = require("./Hall");
const Ticket_1 = require("./Ticket");
let Seat = class Seat {
};
exports.Seat = Seat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Seat.prototype, "seatId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Hall_1.Hall, (hall) => hall.seats, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'hallId' }),
    __metadata("design:type", Hall_1.Hall)
], Seat.prototype, "hall", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 5, scale: 0, nullable: true }),
    __metadata("design:type", Number)
], Seat.prototype, "rowNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'number', precision: 5, scale: 0, nullable: true }),
    __metadata("design:type", Number)
], Seat.prototype, "seatNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Seat.prototype, "seatType", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Ticket_1.Ticket, (ticket) => ticket.seat, { cascade: true }),
    __metadata("design:type", Array)
], Seat.prototype, "tickets", void 0);
exports.Seat = Seat = __decorate([
    (0, typeorm_1.Entity)('seats')
], Seat);
//# sourceMappingURL=Seat.js.map