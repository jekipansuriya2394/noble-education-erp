"""Dual-layer Document Text and OCR Extraction Engine using pdfplumber and Tesseract."""

import io
import logging
import os
import shutil
from typing import List, Dict, Any, Union
from PIL import Image
import pdfplumber
import pytesseract

from app.core.config import settings

logger = logging.getLogger("erp_ocr")


class OCREngine:
    """Extracts digital and scanned text from PDFs and images using pdfplumber and Tesseract OCR."""

    def __init__(self):
        self._configure_tesseract()

    def _configure_tesseract(self) -> None:
        """Locate Tesseract executable on Windows or POSIX environments."""
        if settings.TESSERACT_CMD and os.path.exists(settings.TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            logger.info(f"Using configured Tesseract path: {settings.TESSERACT_CMD}")
            return

        # Common Windows installation locations
        windows_defaults = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        for path in windows_defaults:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                logger.info(f"Auto-detected Tesseract at: {path}")
                return

        # Check PATH
        which_tess = shutil.which("tesseract")
        if which_tess:
            pytesseract.pytesseract.tesseract_cmd = which_tess
            logger.info(f"Found Tesseract in system PATH: {which_tess}")
        else:
            logger.warning(
                "Tesseract executable not found in PATH or standard locations. "
                "Digital PDF text extraction will work via pdfplumber; scanned images will require tesseract installed."
            )

    def extract_text_from_pdf(
        self,
        file_source: Union[str, bytes, io.BytesIO],
        min_chars_for_scanned_check: int = 50,
    ) -> List[Dict[str, Any]]:
        """Extract text from PDF pages, automatically triggering OCR for scanned/image pages.
        
        Args:
            file_source: Filepath string, raw bytes, or BytesIO buffer.
            min_chars_for_scanned_check: If page has fewer characters than this, trigger OCR.
            
        Returns:
            List of dicts: [{'page_number': 1, 'text': '...', 'is_ocr': bool, 'tables': [...]}]
        """
        pages_output: List[Dict[str, Any]] = []

        if isinstance(file_source, bytes):
            stream = io.BytesIO(file_source)
        elif isinstance(file_source, str):
            stream = file_source
        else:
            stream = file_source

        try:
            with pdfplumber.open(stream) as pdf:
                for idx, page in enumerate(pdf.pages, start=1):
                    # 1. First attempt: Direct digital text extraction
                    text = page.extract_text() or ""
                    tables = page.extract_tables() or []

                    is_ocr = False
                    # 2. Second attempt: If text is sparse or page is scanned, fallback to OCR
                    if len(text.strip()) < min_chars_for_scanned_check:
                        logger.info(f"Page {idx} has sparse text ({len(text.strip())} chars). Attempting OCR...")
                        try:
                            # Render page to PIL image
                            page_image = page.to_image(resolution=300).original
                            ocr_text = self.extract_text_from_image(page_image)
                            if len(ocr_text.strip()) > len(text.strip()):
                                text = ocr_text
                                is_ocr = True
                        except Exception as ocr_err:
                            logger.warning(f"OCR attempt failed on page {idx}: {ocr_err}")

                    pages_output.append({
                        "page_number": idx,
                        "text": text.strip(),
                        "is_ocr": is_ocr,
                        "tables": tables,
                    })

            return pages_output

        except Exception as e:
            logger.exception(f"Error extracting text from PDF: {e}")
            raise

    def extract_text_from_image(self, image: Union[Image.Image, bytes, str]) -> str:
        """Run Tesseract OCR on a PIL Image, raw image bytes, or image filepath."""
        try:
            if isinstance(image, bytes):
                pil_img = Image.open(io.BytesIO(image))
            elif isinstance(image, str):
                pil_img = Image.open(image)
            else:
                pil_img = image

            # Convert to grayscale for cleaner character recognition
            gray_img = pil_img.convert("L")
            text = pytesseract.image_to_string(gray_img, lang="eng")
            return text.strip()
        except Exception as e:
            logger.warning(f"Tesseract OCR execution error: {e}")
            return ""


# Global singleton OCR engine
ocr_engine = OCREngine()
