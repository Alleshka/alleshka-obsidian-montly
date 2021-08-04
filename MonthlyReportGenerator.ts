import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFolder, Vault, TFile, View, FuzzySuggestModal } from 'obsidian';
import { IPluginSettings } from 'IPluginSettings';
import { moment } from 'obsidian';
import { resolve } from 'path';

export class MonthlyhReportGenerator {
    private settings: IPluginSettings;
    private app: App;

    constructor(app: App, settings: IPluginSettings) {
        this.settings = settings;
        this.app = app;
    }

    public generateCurMonth(): void {

        let that = this;
        let app = that.app;
        let vault = app.vault;
        let workSpace = app.workspace;

        let curDate = moment().format(this.settings.resultFileNameTemplate);
        let pathToCurFile = this.settings.resultFileDirPath + "/" + curDate + ".md";

        let promise = null;

        let curFile = vault.getAbstractFileByPath(pathToCurFile) as TFile;

        if (!curFile) {
            promise = vault.create(pathToCurFile, "");
        }
        else {
            promise = Promise.resolve(curFile);
        }

        promise = promise.then((resultFile: TFile) => {
            // TODO: Можно оптимизировать и смотреть какая дата сейчас
            let dates = Array.from({ length: moment(curDate).daysInMonth() }, (x, i) => moment().startOf('month').add(i, 'days').format(this.settings.dailyFileNameTemplate));
            console.log(dates);

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

            let resultStr: string = result.join("\n");
            console.log(resultStr);

            vault.modify(resultFile, resultStr);
            return curFile;
        });

        promise = promise.then((resultFile) => workSpace.activeLeaf.openFile(resultFile));

        Promise.all([promise]);
    }
}