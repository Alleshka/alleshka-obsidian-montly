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
		this.settings.orderByDesc = true;
		this.generator = new MonthlyhReportGenerator(this.app, this.settings);

		this.addCommand({
			id: 'generate-month-report',
			name: 'Generate month report',
			callback: () => {
				console.log(this);
				console.log("callback");
			},
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

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
			text: "Settings for MonthReportGenerator",
		});

		let settings = this.plugin.settings;
		this.getSettings(containerEl, "resultFilePath", settings, set => set.resultFileDirPath, (set, val) => set.resultFileDirPath = val);
		this.getSettings(containerEl, "resultFileNameTemplate", settings, set => set.resultFileNameTemplate, (set, val) => set.resultFileNameTemplate = val);

		let root = this.app.vault.getRoot();
		let children = this.getRecursiveDirs(root);
		let isExists = !!children.find(ch => ch.path === settings.dailyFileDirPath);

		if (!isExists) {
			settings.dailyFileDirPath = "/";
			this.plugin.saveData(settings);
		}

		let val = this.plugin.settings.dailyFileDirPath;


		new Setting(containerEl)
			.setName("dailyFilePath")
			.setDesc("dailyFilePath")
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

		this.getSettings(containerEl, "dailyFileNameTemplate", settings, set => set.dailyFileNameTemplate, (set, val) => set.dailyFileNameTemplate = val);
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

	private getSettings(containerEl: HTMLElement, settingName: string, settings: IPluginSettings, propGetter: (settings: IPluginSettings) => string, propSetter: (settings: IPluginSettings, value: string) => void): Setting {
		let value = propGetter(settings) ?? "";

		return new Setting(containerEl)
			.setName(settingName)
			.setDesc(settingName)
			.addText(text => {
				text
					.setPlaceholder(settingName)
					.setValue(value)
					.onChange(async (value) => {
						propSetter(settings, value);
						this.plugin.saveData(settings);
					});
			});
	}

}