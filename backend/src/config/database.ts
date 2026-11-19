import mongoose from "mongoose";

export const getMongoClientPromise = async (): Promise<mongoose.mongo.MongoClient> => {
    if (mongoose.connection.readyState === 1 && mongoose.connection.getClient()) {
        return mongoose.connection.getClient();
    }

    return new Promise<mongoose.mongo.MongoClient>((resolve, reject) => {
        mongoose.connection.once("open", () => {
            const client = mongoose.connection.getClient();
            if (client) {
                resolve(client);
            } else {
                reject(new Error("MongoDB client is not available after connection open"));
            }
        });
        mongoose.connection.on("error", (err) => {
            reject(err);
        });
    });
};

export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
        console.error("Database connection failed: MONGODB_URI is not configured");
        process.exit(1);
    }

    try {
        const connect = await mongoose.connect(mongoUri, {
            dbName: "HOCKEYIITBHU",
        });
        console.log(
            "Database connected successfully",
            connect.connection.host,
            connect.connection.port,
            connect.connection.name,
        );
    } catch (error) {
        if (error instanceof Error) {
            console.error("Database connection failed", error.message);
        } else {
            console.error("Database connection failed");
        }
        process.exit(1);
    }
};

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
};

export default connectDB;
