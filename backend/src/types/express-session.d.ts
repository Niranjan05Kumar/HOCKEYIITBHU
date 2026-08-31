declare module "express-session" {
    interface SessionData {
        adminId?: string;
    }
}

declare global {
    namespace Express {
        interface Request {
            admin?: {
                _id?: string;
                id?: string;
                name: string;
                email: string;
                role: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }
    }
}

export {};
