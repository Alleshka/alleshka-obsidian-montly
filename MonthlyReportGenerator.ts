import { App, Notice, TFile } from 'obsidian';
import { IPluginSettings } from 'IPluginSettings';
import { moment } from 'obsidian';

export class MonthlyhReportGenerator {
    private settings: IPluginSettings;
    private app: App;

    constructor(app: App, settings: IPluginSettings) {
        this.settings = settings;
        this.app = app;
    }

    public generateCurMonth(): Promise<void> {
        let curDate = moment().format(this.settings.resultFileNameTemplate);
        return this.regenerate(curDate);
    }

    public regenerate(fileName: string): Promise<void> {
        let that = this;
        let app = that.app;
        let vault = app.vault;
        let workSpace = app.workspace;

        let date = moment(fileName, this.settings.resultFileNameTemplate).format(this.settings.resultFileNameTemplate);
        let pathToFile = this.settings.resultFileDirPath + "/" + date + ".md";

        let promise = null;

        let curFile = vault.getAbstractFileByPath(pathToFile) as TFile;
        if (!curFile) {
            promise = vault.create(pathToFile, "");
        }
        else {
            promise = Promise.resolve(curFile);
        }

        promise = promise.then((resultFile: TFile) => {
            let dates = Array.from({ length: moment(date).daysInMonth() }, (x, i) => moment(date).startOf('month').add(i, 'days').format(this.settings.dailyFileNameTemplate));
            let result: string[] = [];
            dates.forEach(date => {
                let file = vault.getAbstractFileByPath(this.settings.dailyFileDirPath + "/" + date + ".md");
                if (file) {
                    let link = "![[" + date + "]]";
                    if (this.settings.orderByDesc) {
                        result.unshift(link);
                    } else {
                        result.push(link);
                    }
                }
            });
            vault.modify(resultFile, result.join("\n"));
            return resultFile;
        });

        promise = promise.then((resultFile: TFile) => workSpace.activeLeaf.openFile(resultFile));

        return promise;
    }

    public openPrevMonth(): Promise<void> {
        return this.openMonth(index => index - 1, (index, length) => index == 0);
    }

    public openNextMonth(): Promise<void> {
        return this.openMonth(index => index + 1, (index, length) => index == length - 1);
    }

    private openMonth(indexIterator: (index: number) => number, indexChecker: (index: number, length: number) => boolean): Promise<void> {
        let ws = this.app.workspace;
        let file = ws.getActiveFile();

        let notes = file.parent.children.filter(x => x instanceof TFile);
        let index = notes.findIndex(x => x == file);
        if (indexChecker(index, notes.length)) {
            new Notice("File does't exist");
            return Promise.resolve();
        }
        else {
            return ws.activeLeaf.openFile(notes[indexIterator(index)] as TFile);
        }
    }
}