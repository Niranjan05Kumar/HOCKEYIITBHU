import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect(`${process.env.MONGODB_URI}`, {
            dbName: "HOCKEYIITBHU",
        });
        console.log(
            "Database connected successfully",
            connect.connection.host,
            connect.connection.port,
            connect.connection.name,
        );
    } catch (error) {
        console.log("Database connection failed", error);
        process.exit(1);
    }
};

export default connectDB;
