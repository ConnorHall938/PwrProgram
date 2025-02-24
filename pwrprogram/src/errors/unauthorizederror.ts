export class UnauthorizedException extends Error {
    constructor(message: string) {
        super(message || '')
        this.name = 'UnauthorizedException'
        this.code = 401
    }
    code: number
}