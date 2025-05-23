import * as fs from "fs/promises"
import * as vscode from "vscode"
import { ResourceInliner } from "../ResourceInliner"

// Mock vscode and fs
jest.mock("fs/promises")
jest.mock("vscode", () => ({
	Uri: {
		joinPath: jest.fn(),
	},
}))

const mockedFs = fs as jest.Mocked<typeof fs>
const mockedVscode = vscode as jest.Mocked<typeof vscode>

describe("ResourceInliner", () => {
	let resourceInliner: ResourceInliner
	let mockExtensionUri: vscode.Uri

	beforeEach(() => {
		mockExtensionUri = { fsPath: "/mock/extension/path" } as vscode.Uri
		resourceInliner = new ResourceInliner(mockExtensionUri)

		// Reset mocks
		jest.clearAllMocks()

		// Setup default mock implementations
		;(mockedVscode.Uri.joinPath as jest.Mock).mockReturnValue({ fsPath: "/mock/path" } as vscode.Uri)
	})

	describe("inlineCss", () => {
		it("should inline CSS content successfully", async () => {
			const cssContent = "body { color: red; }"
			mockedFs.readFile.mockResolvedValue(cssContent)

			const result = await resourceInliner.inlineCss(["assets", "styles.css"])

			expect(result).toBe(`<style>\n${cssContent}\n</style>`)
			expect(mockedVscode.Uri.joinPath).toHaveBeenCalledWith(mockExtensionUri, "assets", "styles.css")
		})

		it("should handle CSS file read errors gracefully", async () => {
			mockedFs.readFile.mockRejectedValue(new Error("File not found"))

			const result = await resourceInliner.inlineCss(["assets", "missing.css"])

			expect(result).toBe("<!-- Failed to inline CSS: assets/missing.css -->")
		})
	})

	describe("svgToDataUri", () => {
		it("should convert SVG to data URI successfully", async () => {
			const svgContent = '<svg><path d="M0,0L10,10"/></svg>'
			mockedFs.readFile.mockResolvedValue(svgContent)

			const result = await resourceInliner.svgToDataUri(["assets", "icon.svg"])

			const expectedBase64 = Buffer.from(svgContent).toString("base64")
			expect(result).toBe(`data:image/svg+xml;base64,${expectedBase64}`)
		})

		it("should handle SVG file read errors gracefully", async () => {
			mockedFs.readFile.mockRejectedValue(new Error("File not found"))

			const result = await resourceInliner.svgToDataUri(["assets", "missing.svg"])

			expect(result).toBe("")
		})
	})

	describe("imageToDataUri", () => {
		it("should convert image to data URI successfully", async () => {
			const imageBuffer = Buffer.from("fake-image-data")
			mockedFs.readFile.mockResolvedValue(imageBuffer)

			const result = await resourceInliner.imageToDataUri(["assets", "image.png"], "image/png")

			const expectedBase64 = imageBuffer.toString("base64")
			expect(result).toBe(`data:image/png;base64,${expectedBase64}`)
		})

		it("should handle image file read errors gracefully", async () => {
			mockedFs.readFile.mockRejectedValue(new Error("File not found"))

			const result = await resourceInliner.imageToDataUri(["assets", "missing.png"], "image/png")

			expect(result).toBe("")
		})
	})

	describe("fileExists", () => {
		it("should return true if file exists", async () => {
			mockedFs.access.mockResolvedValue(undefined)

			const result = await resourceInliner.fileExists(["assets", "file.txt"])

			expect(result).toBe(true)
		})

		it("should return false if file does not exist", async () => {
			mockedFs.access.mockRejectedValue(new Error("File not found"))

			const result = await resourceInliner.fileExists(["assets", "missing.txt"])

			expect(result).toBe(false)
		})
	})

	describe("getInlinedResourcesData", () => {
		it("should return inlined resources data", async () => {
			// Mock file existence checks
			mockedFs.access.mockResolvedValue(undefined)

			// Mock file content
			mockedFs.readFile
				.mockResolvedValueOnce('<svg><path d="M0,0L10,10"/></svg>') // roo-logo.svg
				.mockResolvedValueOnce(Buffer.from("openrouter-image-data")) // openrouter.png
				.mockResolvedValueOnce(Buffer.from("requesty-image-data")) // requesty.png

			const result = await resourceInliner.getInlinedResourcesData()

			expect(result.rooLogoSvg).toContain("data:image/svg+xml;base64,")
			expect(result.openrouterPng).toContain("data:image/png;base64,")
			expect(result.requestyPng).toContain("data:image/png;base64,")
		})

		it("should handle missing files gracefully", async () => {
			// Mock file existence checks to fail
			mockedFs.access.mockRejectedValue(new Error("File not found"))

			const result = await resourceInliner.getInlinedResourcesData()

			expect(result.rooLogoSvg).toBe("")
			expect(result.openrouterPng).toBe("")
			expect(result.requestyPng).toBe("")
		})
	})
})
