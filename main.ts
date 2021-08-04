import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFolder, Vault, moment, TFile } from 'obsidian';
import { IPluginSettings } from 'IPluginSettings';
import { MonthlyhReportGenerator } from 'MonthlyReportGenerator';

export default class MyPlugin extends Plugin {

	settings: IPluginSettings;
	generator: MonthlyhReportGenerator;

	async onload() {
		console.log('loading plugin');
		await this.loadSettings();

		this.addSettingTab(new SimpleSettingsTab(this.app, this));
		this.generator = new MonthlyhReportGenerator(this.app, this.settings);

		this._initCommands();
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private _initCommands(): void {
		this.addCommand({
			id: "open-cur-month",
			name: "Open cur month",
			checkCallback: (checking: boolean) => {
				if (!checking) {
					let app = this.app;
					let date = moment().format(this.settings.resultFileNameTemplate);
					let file = app.vault.getAbstractFileByPath(this.settings.resultFileDirPath + "/" + date + ".md") as TFile;

					let promise = null;
					if (!file) {
						promise = this.generator.generateCurMonth();
					}
					else {
						app.workspace.activeLeaf.openFile(file);
					}
				}
				return true;
			}
		});

		this.addCommand({
			id: 'generate-monthly-report',
			name: 'Generate monthly report',
			checkCallback: (checking: boolean) => {
				console.log("checking: " + checking);

				// Если выполнение команды
				if (!checking) {
					console.log("executing");
					this.generator.generateCurMonth();
				}

				return true;
			}
		});
	}
}
class SimpleSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', {
			text: "Settings for Monthly",
		});

		let root = this.app.vault.getRoot();
		let children = this.getRecursiveDirs(root);

		let settings = this.plugin.settings;

		let isResultExists = !!children.find(ch => ch.path === settings.resultFileDirPath);
		if (!isResultExists) {
			settings.resultFileDirPath = "/";
			this.plugin.saveData(settings);
		}

		let resultVal = this.plugin.settings.resultFileDirPath;
		new Setting(containerEl)
			.setName("Result file location")
			.setDesc("Monthly notes will be placed here")
			.addDropdown(dd => {
				children.forEach(ch => {
					dd.addOption(ch.path, ch.path);
				});

				dd
					.setValue(resultVal)
					.onChange(async (value) => {
						settings.resultFileDirPath = value;
						this.plugin.saveData(settings);
					});
			});

		new Setting(containerEl)
			.setName("Monthly date format")
			.addText(text => {
				text
					.setPlaceholder("YYYY.MM")
					.setValue(settings.resultFileNameTemplate ?? "")
					.onChange(async (value) => {
						settings.resultFileNameTemplate = value;
						this.plugin.saveData(settings);
					});
			});

		let isDailyExists = !!children.find(ch => ch.path === settings.dailyFileDirPath);
		if (!isDailyExists) {
			settings.dailyFileDirPath = "/";
			this.plugin.saveData(settings);
		}

		let val = this.plugin.settings.dailyFileDirPath;
		new Setting(containerEl)
			.setName("Daily file location")
			.setDesc("Will look for daily notes here")
			.addDropdown(dd => {
				children.forEach(ch => {
					dd.addOption(ch.path, ch.path);
				});

				dd
					.setValue(val)
					.onChange(async (value) => {
						settings.dailyFileDirPath = value;
						this.plugin.saveData(settings);
					});
			});

		new Setting(containerEl)
			.setName("Daily date format")
			.addText(text => {
				text
					.setPlaceholder("YYYY-MM-DD")
					.setValue(settings.dailyFileNameTemplate ?? "")
					.onChange(async (value) => {
						settings.dailyFileNameTemplate = value;
						this.plugin.saveData(settings);
					});
			});

		new Setting(containerEl)
			.setName("Order by desc")
			.setDesc("Links will be sorted by descending")
			.addToggle(x => {
				x
					.setValue(!!settings.orderByDesc)
					.onChange(async (val) => {
						settings.orderByDesc = val;
						this.plugin.saveData(settings);
					})
			});
	}

	private getRecursiveDirs(root: TFolder): TFolder[] {
		let result: TFolder[] = [];
		let stack: TFolder[] = [];

		stack.push(root);

		while (stack.length != 0) {
			let file = stack.shift();
			result.push(file);

			let folder = file as TFolder;
			let children = folder.children.reverse();
			children.forEach(ch => {
				if (ch instanceof TFolder) {
					stack.unshift(ch);
				}
			});
		}


		return result;
	}
}