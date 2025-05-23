import { useState } from "react"

const RooHero = () => {
	const [resources] = useState(() => {
		const w = window as any
		return {
			imagesBaseUri: w.IMAGES_BASE_URI || "",
			inlinedResources: w.INLINED_RESOURCES || {},
		}
	})

	// Use inlined resource if available, fallback to base URI
	const rooLogoSrc = resources.inlinedResources["roo-logo.svg"] || `${resources.imagesBaseUri}/roo-logo.svg`

	return (
		<div className="flex flex-col items-center justify-center pb-4 forced-color-adjust-none">
			<div
				style={{
					backgroundColor: "var(--vscode-foreground)",
					WebkitMaskImage: `url('${rooLogoSrc}')`,
					WebkitMaskRepeat: "no-repeat",
					WebkitMaskSize: "contain",
					maskImage: `url('${rooLogoSrc}')`,
					maskRepeat: "no-repeat",
					maskSize: "contain",
				}}
				className="mx-auto">
				<img src={rooLogoSrc} alt="Roo logo" className="h-8 opacity-0" />
			</div>
		</div>
	)
}

export default RooHero
