import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

// Configuration
const CONFIG = {
  inputFolder: path.join(__dirname, '../documents/Letters'),
  outputFolder: path.join(__dirname, '../documents/parseData'),
  supportedExtensions: ['.pdf'],
  encoding: 'utf-8' as const
};

interface ParsedDocument {
  filename: string;
  originalPath: string;
  content: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  parseDate: Date;
  wordCount: number;
  characterCount: number;
}

class PDFParser {
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  private async parsePDF(filePath: string): Promise<ParsedDocument> {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      
      const filename = path.basename(filePath, '.pdf');
      const content = this.cleanText(data.text);
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        filename,
        originalPath: filePath,
        content,
        pageCount: data.numpages,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate,
          modificationDate: data.info?.ModDate
        },
        parseDate: new Date(),
        wordCount,
        characterCount: content.length
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines to max 2
      .replace(/[ \t]+/g, ' ')  // Normalize whitespace
      .trim();
  }

  private generateDocumentHeader(doc: ParsedDocument): string {
    const separator = '='.repeat(80);
    const header = [
      separator,
      `DOCUMENT: ${doc.filename}`,
      separator,
      `Original File: ${doc.originalPath}`,
      `Parse Date: ${doc.parseDate.toISOString()}`,
      `Pages: ${doc.pageCount}`,
      `Word Count: ${doc.wordCount}`,
      `Character Count: ${doc.characterCount}`,
      ''
    ];

    // Add metadata if available
    if (Object.values(doc.metadata).some(value => value !== undefined)) {
      header.push('METADATA:');
      Object.entries(doc.metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          header.push(`  ${key}: ${value}`);
        }
      });
      header.push('');
    }

    header.push(separator, 'CONTENT:', separator, '');
    
    return header.join('\n');
  }

  private saveOrganizedContent(doc: ParsedDocument): void {
    const outputPath = path.join(CONFIG.outputFolder, `${doc.filename}.txt`);
    const header = this.generateDocumentHeader(doc);
    const fullContent = header + doc.content;

    fs.writeFileSync(outputPath, fullContent, CONFIG.encoding);
    console.log(`✓ Saved: ${outputPath}`);
  }

  private generateSummaryReport(documents: ParsedDocument[]): void {
    const summaryPath = path.join(CONFIG.outputFolder, '_PARSING_SUMMARY.txt');
    const totalPages = documents.reduce((sum, doc) => sum + doc.pageCount, 0);
    const totalWords = documents.reduce((sum, doc) => sum + doc.wordCount, 0);
    const totalCharacters = documents.reduce((sum, doc) => sum + doc.characterCount, 0);

    const summary = [
      '='.repeat(80),
      'PDF PARSING SUMMARY REPORT',
      '='.repeat(80),
      `Generated: ${new Date().toISOString()}`,
      `Total Documents Processed: ${documents.length}`,
      `Total Pages: ${totalPages}`,
      `Total Words: ${totalWords.toLocaleString()}`,
      `Total Characters: ${totalCharacters.toLocaleString()}`,
      '',
      'PROCESSED DOCUMENTS:',
      '-'.repeat(80),
      ...documents.map(doc => 
        `${doc.filename.padEnd(30)} | ${doc.pageCount.toString().padStart(3)} pages | ${doc.wordCount.toLocaleString().padStart(8)} words`
      ),
      '',
      'FILES LOCATION:',
      `Input Folder: ${CONFIG.inputFolder}`,
      `Output Folder: ${CONFIG.outputFolder}`,
      '='.repeat(80)
    ];

    fs.writeFileSync(summaryPath, summary.join('\n'), CONFIG.encoding);
    console.log(`📊 Summary report saved: ${summaryPath}`);
  }

  async run(): Promise<void> {
    console.log('🚀 Starting PDF parsing process...');
    
    try {
      // Ensure directories exist
      this.ensureDirectoryExists(CONFIG.outputFolder);
      
      if (!fs.existsSync(CONFIG.inputFolder)) {
        throw new Error(`Input folder does not exist: ${CONFIG.inputFolder}`);
      }

      // Get all PDF files
      const allFiles = fs.readdirSync(CONFIG.inputFolder);
      const pdfFiles = allFiles.filter(file => 
        CONFIG.supportedExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );

      if (pdfFiles.length === 0) {
        console.log('⚠️  No PDF files found in the input folder.');
        return;
      }

      console.log(`📄 Found ${pdfFiles.length} PDF file(s) to process.`);

      const processedDocuments: ParsedDocument[] = [];
      const errors: string[] = [];

      // Process each PDF file
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const filePath = path.join(CONFIG.inputFolder, file);
        
        console.log(`📖 Processing [${i + 1}/${pdfFiles.length}]: ${file}`);

        try {
          const document = await this.parsePDF(filePath);
          this.saveOrganizedContent(document);
          processedDocuments.push(document);
        } catch (error) {
          const errorMessage = `❌ Error processing ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMessage);
          errors.push(errorMessage);
        }
      }

      // Generate summary report
      if (processedDocuments.length > 0) {
        this.generateSummaryReport(processedDocuments);
      }

      // Final report
      console.log('\n' + '='.repeat(60));
      console.log('PROCESSING COMPLETE');
      console.log('='.repeat(60));
      console.log(`Successfully processed: ${processedDocuments.length} files`);
      console.log(`Failed to process: ${errors.length} files`);
      console.log(`Output directory: ${CONFIG.outputFolder}`);
      
      if (errors.length > 0) {
        console.log('\n ERRORS:');
        errors.forEach(error => console.log(`  ${error}`));
      }
      
    } catch (error) {
      console.error('Fatal error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Execute the parser
const parser = new PDFParser();
parser.run().catch(console.error);