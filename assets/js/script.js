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
const infoDisplay = document.getElementById("infoDisplay");
const insertTableButton = document.getElementById("insertTable");
const searchInput = document.getElementById("searchInput");
const replaceInput = document.getElementById("replaceInput");
const resultCount = document.getElementById("resultCount");


const undoStack = [];
const redoStack = [];

const md = window.markdownit()
	// .use(window.markdownitKatex)
	// .use(window.markdownitMermaid);

function updateInfo() {
	const content = markdownInput.value;
	const lines = content.split('\n').length;
	const words = content.match(/\b\w+\b/g)?.length || 0;
	const fileSize = new Blob([content], { type: 'text/markdown' }).size;

	const cursorPosition = markdownInput.selectionStart;
	const contentUpToCursor = content.substring(0, cursorPosition);
	const currentLine = contentUpToCursor.split('\n').length;
	const currentColumn = contentUpToCursor.split('\n').pop().length + 1;

	infoDisplay.innerHTML = `
        <p class="mr-2"><strong>${fileSize}</strong> bytes</p>
        <p class="mr-2"><strong>${lines}</strong> lines</p>
        <p class="mr-2"><strong>${words}</strong> words</p>
        <p class="mr-2">Ln ${currentLine}, Col ${currentColumn}</p>
    `;
}

function undo() {
	if (undoStack.length > 0) {
		redoStack.push(markdownInput.value);
		const previousState = undoStack.pop();
		markdownInput.value = previousState;
		preview.innerHTML = md.render(previousState);
	}
}

function redo() {
	if (redoStack.length > 0) {
		undoStack.push(markdownInput.value);
		const nextState = redoStack.pop();
		markdownInput.value = nextState;
		preview.innerHTML = md.render(nextState);
	}
}

function insertTextAtCursor(text) {
	const startPos = markdownInput.selectionStart;
	const endPos = markdownInput.selectionEnd;
	const beforeText = markdownInput.value.substring(0, startPos);
	const afterText = markdownInput.value.substring(endPos);
	markdownInput.value = beforeText + text + afterText;
	undoStack.push(markdownInput.value);
	markdownInput.focus();
	markdownInput.selectionEnd = startPos + text.length;
	markdownInput.dispatchEvent(new Event('input'));
}

function wrapTextWithFormatting(startWrapper, endWrapper = startWrapper) {
	const startPos = markdownInput.selectionStart;
	const endPos = markdownInput.selectionEnd;
	const selectedText = markdownInput.value.substring(startPos, endPos);

	if (selectedText) {
		const beforeText = markdownInput.value.substring(0, startPos);
		const afterText = markdownInput.value.substring(endPos);
		markdownInput.value = beforeText + startWrapper + selectedText + endWrapper + afterText;
		undoStack.push(markdownInput.value);
		markdownInput.focus();
		markdownInput.selectionStart = startPos;
		markdownInput.selectionEnd = endPos + startWrapper.length + endWrapper.length;
		markdownInput.dispatchEvent(new Event('input'));
	} else {
		insertTextAtCursor(startWrapper + "text" + endWrapper);
	}
}

function renderPreview() {
	const markdownText = markdownInput.value;
	undoStack.push(markdownText);
	preview.innerHTML = md.render(markdownText);
}

fontSelect.addEventListener("change", () => {
	const selectedFont = fontSelect.value;
	preview.style.fontFamily = selectedFont;
});

document.getElementById("boldButton").addEventListener("click", () => {
	wrapTextWithFormatting("**");
});

document.getElementById("italicButton").addEventListener("click", () => {
	wrapTextWithFormatting("*");
});

document.getElementById("strikethroughButton").addEventListener("click", () => {
	wrapTextWithFormatting("~~");
});

document.getElementById("orderedListButton").addEventListener("click", () => {
	wrapTextWithFormatting("1. ", "\n");
});

document.getElementById("unorderedListButton").addEventListener("click", () => {
	wrapTextWithFormatting("- ", "\n");
});

document.getElementById("linkButton").addEventListener("click", () => {
	wrapTextWithFormatting("[", "](url)");
});

document.getElementById("imageButton").addEventListener("click", () => {
	wrapTextWithFormatting("![", "](image_url)");
});

function insertTableMarkdown() {
	const tableMarkdown =
		`| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |\n`;
	const selectionStart = markdownInput.selectionStart;
	const selectionEnd = markdownInput.selectionEnd;

	markdownInput.setRangeText(tableMarkdown, selectionStart, selectionEnd, 'end');
	markdownInput.dispatchEvent(new Event('input'));
}

insertTableButton.addEventListener("click", insertTableMarkdown);

function addHeaderMarkdown(headerLevel) {
	const selectionStart = markdownInput.selectionStart;
	const selectionEnd = markdownInput.selectionEnd;
	const selectedText = markdownInput.value.substring(selectionStart, selectionEnd);
	const prefix = "#".repeat(headerLevel) + " ";

	const newText = prefix + selectedText;

	markdownInput.setRangeText(newText, selectionStart, selectionEnd, 'end');
	markdownInput.dispatchEvent(new Event('input'));
}

document.getElementById("headerH1").addEventListener("click", () => addHeaderMarkdown(1));
document.getElementById("headerH2").addEventListener("click", () => addHeaderMarkdown(2));
document.getElementById("headerH3").addEventListener("click", () => addHeaderMarkdown(3));
document.getElementById("headerH4").addEventListener("click", () => addHeaderMarkdown(4));
document.getElementById("headerH5").addEventListener("click", () => addHeaderMarkdown(5));
document.getElementById("headerH6").addEventListener("click", () => addHeaderMarkdown(6));

document.getElementById("undoButton").addEventListener("click", undo);
document.getElementById("redoButton").addEventListener("click", redo);

document.getElementById("searchButton").addEventListener("click", function () {
	const searchReplaceContainer = document.getElementById("searchReplaceContainer");
	if (searchReplaceContainer.style.display === "none" || searchReplaceContainer.style.display === "") {
		searchReplaceContainer.style.display = "flex";
	} else {
		searchReplaceContainer.style.display = "none";
	}
});

let currentIndex = 0;
let matches = [];

function search() {
	const searchText = searchInput.value.trim();
	const content = document.getElementById("markdownInput").value;

	// Reset previous matches
	matches = [];
	currentIndex = 0;

	if (searchText) {
		const regex = new RegExp(searchText, "gi");
		let match;

		while ((match = regex.exec(content)) !== null) {
			matches.push(match.index);
		}
	}

	updateResultCount();
}

function updateResultCount() {
	resultCount.textContent = `${matches.length}`;
}

function highlightMatch() {
	if (matches.length > 0) {
		const content = document.getElementById("markdownInput").value;
		const position = matches[currentIndex];

		// Scroll to the match
		document.getElementById("markdownInput").focus();
		document.getElementById("markdownInput").setSelectionRange(position, position + searchInput.value.length);
	}
}

prevButton.addEventListener("click", () => {
	if (matches.length > 0) {
		currentIndex = (currentIndex - 1 + matches.length) % matches.length;
		highlightMatch();
	}
});

nextButton.addEventListener("click", () => {
	if (matches.length > 0) {
		currentIndex = (currentIndex + 1) % matches.length;
		highlightMatch();
	}
});

searchInput.addEventListener("input", search);

replaceButton.addEventListener("click", () => {
	if (matches.length > 0) {
		const content = document.getElementById("markdownInput").value;
		const position = matches[currentIndex];
		const beforeText = content.slice(0, position);
		const afterText = content.slice(position + searchInput.value.length);

		document.getElementById("markdownInput").value = beforeText + replaceInput.value + afterText;
		renderPreview()
		search(); 
	}
});

replaceAllButton.addEventListener("click", () => {
	const searchText = searchInput.value.trim();
	const replaceText = replaceInput.value;
	const content = document.getElementById("markdownInput").value;

	if (searchText) {
		const regex = new RegExp(searchText, "gi");
		document.getElementById("markdownInput").value = content.replace(regex, replaceText);
		renderPreview()
		search();
	}
});


markdownInput.addEventListener("input", () => {
	updateInfo();
	renderPreview();
});
markdownInput.addEventListener("click", updateInfo);
markdownInput.addEventListener("change", updateInfo);
markdownInput.addEventListener("keyup", updateInfo);

markdownInput.addEventListener("scroll", () => {
	const scrollPosition = markdownInput.scrollTop;
	preview.scrollTop = scrollPosition;
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
	modalInstance.show();
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
