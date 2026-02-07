import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

// Mock implementation for isolated environments
class MockCollection {
    name: string;
    filePath: string;

    constructor(name: string) {
        this.name = name;
        this.filePath = path.join(process.cwd(), 'mock_db', `${name}.json`);
        if (!fs.existsSync(path.dirname(this.filePath))) {
            fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
        }
    }

    private read(): any[] {
        try {
            if (!fs.existsSync(this.filePath)) return [];
            return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
        } catch {
            return [];
        }
    }

    private write(data: any[]) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    find(query: any = {}) {
        let data = this.read();
        if (Object.keys(query).length > 0) {
            data = data.filter(item => {
                return Object.entries(query).every(([key, value]) => item[key] === value);
            });
        }

        const cursor = {
            _data: [...data],
            sort(sortQuery: any) {
                this._data.sort((a, b) => {
                    const key = Object.keys(sortQuery)[0];
                    const dir = sortQuery[key];
                    if (a[key] > b[key]) return dir;
                    if (a[key] < b[key]) return -dir;
                    return 0;
                });
                return this;
            },
            project(projectQuery: any) {
                this._data = this._data.map(item => {
                    const newItem = { ...item };
                    Object.entries(projectQuery).forEach(([key, val]) => {
                        if (val === 0) delete newItem[key];
                    });
                    return newItem;
                });
                return this;
            },
            limit(n: number) {
                this._data = this._data.slice(0, n);
                return this;
            },
            async toArray() {
                return this._data;
            },
        };

        return cursor;
    }

    aggregate(pipeline: any[]) {
        const data = this.read();
        let result = [...data];

        // Minimal pipeline support for the specific stats query
        for (const stage of pipeline) {
            if (stage.$group) {
                const group = stage.$group;
                const stats: any = { _id: group._id };

                for (const [key, op] of Object.entries(group)) {
                    if (key === '_id') continue;
                    const operator = Object.keys(op as any)[0];
                    const field = (op as any)[operator].toString().replace('$', '');

                    if (operator === '$sum') {
                        if (typeof (op as any)[operator] === 'object' && (op as any)[operator].$cond) {
                            const cond = (op as any)[operator].$cond;
                            const fieldToTest = cond[0].replace('$', '');
                            stats[key] = result.reduce((acc, item) => acc + (item[fieldToTest] ? cond[1] : cond[2]), 0);
                        } else {
                            stats[key] = result.reduce((acc, item) => acc + (item[field] || 0), 0);
                        }
                    } else if (operator === '$avg') {
                        const values = result.map(item => item[field]).filter(v => v !== undefined);
                        stats[key] = values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0;
                    }
                }
                result = [stats];
            }
        }

        return {
            toArray: async () => result,
        };
    }

    async findOne(query: any) {
        const data = this.read();
        return data.find(item => {
            return Object.entries(query).every(([key, value]) => item[key] === value);
        }) || null;
    }

    async insertOne(doc: any) {
        const data = this.read();
        const newDoc = { ...doc, _id: doc.id || Math.random().toString(36).substr(2, 9) };
        data.push(newDoc);
        this.write(data);
        return { insertedId: newDoc._id };
    }

    async updateOne(query: any, update: any) {
        const data = this.read();
        const index = data.findIndex(item => {
            return Object.entries(query).every(([key, value]) => item[key] === value);
        });
        if (index !== -1) {
            if (update.$set) {
                data[index] = { ...data[index], ...update.$set };
            }
            this.write(data);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    }

    async deleteOne(query: any) {
        const data = this.read();
        const newData = data.filter(item => {
            return !Object.entries(query).every(([key, value]) => item[key] === value);
        });
        const deletedCount = data.length - newData.length;
        this.write(newData);
        return { deletedCount };
    }

    async deleteMany(query: any) {
        const data = this.read();
        const newData = data.filter(item => {
            return !Object.entries(query).every(([key, value]) => item[key] === value);
        });
        const deletedCount = data.length - newData.length;
        this.write(newData);
        return { deletedCount };
    }

    async countDocuments(query: any = {}) {
        const cursor = this.find(query);
        const arr = await cursor.toArray();
        return arr.length;
    }
}

class MockDb {
    collection(name: string) {
        return new MockCollection(name) as unknown as Collection<any>;
    }
}

async function getClientPromise(): Promise<MongoClient> {
    if (clientPromise) return clientPromise;

    try {
        if (process.env.NODE_ENV === 'development') {
            const globalWithMongo = global as typeof globalThis & {
                _mongoClientPromise?: Promise<MongoClient>;
            };

            if (!globalWithMongo._mongoClientPromise) {
                client = new MongoClient(uri, { ...options, serverSelectionTimeoutMS: 2000 });
                globalWithMongo._mongoClientPromise = client.connect();
            }
            clientPromise = globalWithMongo._mongoClientPromise;
        } else {
            client = new MongoClient(uri, { ...options, serverSelectionTimeoutMS: 2000 });
            clientPromise = client.connect();
        }
        await clientPromise;
        return clientPromise!;
    } catch (error) {
        console.warn('MongoDB connection failed, falling back to Mock DB:', (error as Error).message);
        const mockClient = {
            db: () => new MockDb() as unknown as Db,
            close: async () => { },
        };
        clientPromise = Promise.resolve(mockClient as unknown as MongoClient);
        return clientPromise;
    }
}

export default getClientPromise;

export async function getDb(): Promise<Db> {
    const connection = await getClientPromise();
    return connection.db(process.env.MONGODB_DB || 'flowread_db');
}
