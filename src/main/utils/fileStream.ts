import * as fse from 'fs-extra';

class FileStream {
    public filePath: string;
    public stream: fse.WriteStream;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    public create(): boolean {
        this.stream = fse.createWriteStream(this.filePath);

        return !!this.stream;
    }

    public async writeJson(jsonData: any): Promise<void> {
        return this.write(JSON.stringify(jsonData || {}, null, 4));
    }

    public async write(data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const cb = (err: any, res: any) => {
                if (err) {
                    return reject(err);
                }

                return resolve(res);
            };

            if (!this.stream.write(data)) {
                this.stream.once('drain', cb);
            }
            else {
                process.nextTick(cb);
            }
        });
    }

    public async close(): Promise<void> {
        return new Promise((resolve) => {
            this.stream.end();
            this.stream.once('close', () => {
                return resolve();
            });
        });
    }
}

export function fileStream(filePath: string): FileStream {
    return new FileStream(filePath);
}
