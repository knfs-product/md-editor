document.addEventListener('DOMContentLoaded', () => {
	const lazyBackgrounds = document.querySelectorAll('#slider[data-bg]');
	if ('IntersectionObserver' in window) {
		const lazyBackgroundObserver = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const lazyBackground = entry.target;
					lazyBackground.style.backgroundImage = `url(${lazyBackground.dataset.bg})`;
					lazyBackgroundObserver.unobserve(lazyBackground);
				}
			});
		});

		lazyBackgrounds.forEach(lazyBackground => {
			lazyBackgroundObserver.observe(lazyBackground);
		});
	} else {
		lazyBackgrounds.forEach(lazyBackground => {
			lazyBackground.style.backgroundImage = `url(${lazyBackground.dataset.bg})`;
		});
	}
})

const fontSelect = document.getElementById("fontSelect");
const preview = document.getElementById("preview");
const exportButton = document.getElementById("exportPdf");
const closePdf = document.getElementById("closePdf");
const exportOptionsModal = document.getElementById("exportOptionsModal");
const downloadMarkdownButton = document.getElementById("downloadMarkdown");
const markdownInput = document.getElementById("markdownInput");

fontSelect.addEventListener("change", () => {
	const selectedFont = fontSelect.value;
	preview.style.fontFamily = selectedFont;
});

markdownInput.addEventListener("input", () => {
	const markdownText = markdownInput.value;
	preview.innerHTML = marked.parse(markdownText);
});

downloadMarkdownButton.addEventListener("click", () => {
	const markdownContent = markdownInput.value;

	const blob = new Blob([markdownContent], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "KNFs_markdown.md";
	a.click();

	URL.revokeObjectURL(url);
});

var modalInstance;

exportButton.addEventListener("click", () => {
	preview.scrollTop = 0;
	modalInstance = new bootstrap.Modal(exportOptionsModal);
	modalInstance.show()
});

closePdf.addEventListener("click", () => {
	if (modalInstance) {
		modalInstance.hide();
	}
});



const pageSizeSelect = document.getElementById("pageSize");
const orientationSelect = document.getElementById("orientation");
const imageQualityInput = document.getElementById("imageQuality");
const previewPdfButton = document.getElementById("previewPdf");
const downloadPdfButton = document.getElementById("downloadPdf");
const pdfPreviewContainer = document.getElementById("pdfPreview");

previewPdfButton.addEventListener("click", () => {
	preview.scrollTop = 0;

	const pageSize = pageSizeSelect.value;
	const orientation = orientationSelect.value;
	const imageQuality = imageQualityInput.value;

	const options = {
		margin: 1,
		filename: "KNFs_markdown_preview.pdf",
		image: { type: "jpeg", quality: imageQuality / 100 },
		html2canvas: { scale: 1 },
		jsPDF: { unit: "in", format: pageSize, orientation: orientation }
	};

	pdfPreviewContainer.innerHTML = "Loading preview...";

	html2pdf().set(options).from(preview).outputImg("datauristring").then((dataUri) => {
		const imgElement = document.createElement("img");
		imgElement.src = dataUri;
		imgElement.style.width = "100%";
		pdfPreviewContainer.innerHTML = "";
		pdfPreviewContainer.appendChild(imgElement);
	});
});

downloadPdfButton.addEventListener("click", () => {
	preview.scrollTop = 0;

	const pageSize = pageSizeSelect.value;
	const orientation = orientationSelect.value;
	const imageQuality = imageQualityInput.value;

	const options = {
		margin: 1,
		filename: "KNFs_markdown.pdf",
		image: { type: "jpeg", quality: imageQuality / 100 },
		html2canvas: { scale: 1 },
		jsPDF: { unit: "in", format: pageSize, orientation: orientation }
	};

	html2pdf().set(options).from(preview).save();
});
