/**
 * PDF 파일에서 텍스트 추출
 */
export async function extractTextFromPDF(file: File | Buffer): Promise<string> {
  try {
    // pdf-parse는 CommonJS 모듈이므로 require 사용
    const pdfParse = require('pdf-parse')
    
    let buffer: Buffer

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
