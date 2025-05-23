import * as fs from "fs/promises"
import * as path from "path"
import * as vscode from "vscode"

/**
 * Utility class for inlining resources to avoid CORS/CORP issues in VS Code webviews
 * when accessed through tunnels in Firefox/Safari.
 */
export class ResourceInliner {
	constructor(private extensionUri: vscode.Uri) {}

	/**
	 * Read and inline a CSS file as a <style> tag
	 */
	async inlineCss(relativePath: string[]): Promise<string> {
		try {
			const cssPath = vscode.Uri.joinPath(this.extensionUri, ...relativePath)
			const cssContent = await fs.readFile(cssPath.fsPath, "utf8")
			return `<style>\n${cssContent}\n</style>`
		} catch (error) {
			console.warn(`Failed to inline CSS ${relativePath.join("/")}: ${error}`)
			return `<!-- Failed to inline CSS: ${relativePath.join("/")} -->`
		}
	}

	/**
	 * Read and convert an SVG to a data URI
	 */
	async svgToDataUri(relativePath: string[]): Promise<string> {
		try {
			const svgPath = vscode.Uri.joinPath(this.extensionUri, ...relativePath)
			const svgContent = await fs.readFile(svgPath.fsPath, "utf8")
			const base64 = Buffer.from(svgContent).toString("base64")
			return `data:image/svg+xml;base64,${base64}`
		} catch (error) {
			console.warn(`Failed to convert SVG to data URI ${relativePath.join("/")}: ${error}`)
			return ""
		}
	}

	/**
	 * Read and convert an image to a data URI
	 */
	async imageToDataUri(relativePath: string[], mimeType: string): Promise<string> {
		try {
			const imagePath = vscode.Uri.joinPath(this.extensionUri, ...relativePath)
			const imageContent = await fs.readFile(imagePath.fsPath)
			const base64 = imageContent.toString("base64")
			return `data:${mimeType};base64,${base64}`
		} catch (error) {
			console.warn(`Failed to convert image to data URI ${relativePath.join("/")}: ${error}`)
			return ""
		}
	}

	/**
	 * Check if a file exists
	 */
	async fileExists(relativePath: string[]): Promise<boolean> {
		try {
			const filePath = vscode.Uri.joinPath(this.extensionUri, ...relativePath)
			await fs.access(filePath.fsPath)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Generate inlined resources as a data object for injection into the webview
	 */
	async getInlinedResourcesData(): Promise<{
		rooLogoSvg: string
		openrouterPng: string
		requestyPng: string
	}> {
		const resources = {
			rooLogoSvg: "",
			openrouterPng: "",
			requestyPng: "",
		}

		// Inline critical SVG files
		if (await this.fileExists(["assets", "images", "roo-logo.svg"])) {
			resources.rooLogoSvg = await this.svgToDataUri(["assets", "images", "roo-logo.svg"])
		}

		// Inline critical PNG files
		if (await this.fileExists(["assets", "images", "openrouter.png"])) {
			resources.openrouterPng = await this.imageToDataUri(["assets", "images", "openrouter.png"], "image/png")
		}

		if (await this.fileExists(["assets", "images", "requesty.png"])) {
			resources.requestyPng = await this.imageToDataUri(["assets", "images", "requesty.png"], "image/png")
		}

		return resources
	}
}
