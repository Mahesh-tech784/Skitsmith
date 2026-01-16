# Troubleshooting: "No Documents Found" Error

## Problem
When you send a message to the chatbot, you get:
> ⚠️ No documents found in the knowledge base. Please upload documents first by clicking 'Upload Doc' in the chatbot list.

## Solution

This error occurs because the chatbot doesn't have any documents to reference. Follow these steps:

### Step 1: Go to the Chatbot List
1. Click **"My Chatbots"** in the header navigation
2. You'll see a table of all your chatbots

### Step 2: Upload Documents
For the chatbot you want to use:
1. Click the **"Upload Doc"** button (blue button on the right side of the chatbot row)
2. You'll be taken to the "📄 PDF Upload Manager" page

### Step 3: Select and Upload a PDF
1. Click **"Select PDF File"** button
2. Choose a PDF file from your computer
3. Click **"Upload"** button
4. Wait for the upload to complete
5. You should see a success message

### Step 4: Wait for Processing
⚠️ **Important:** The system processes documents in the background. This might take 30-60 seconds depending on the file size.

After uploading:
- The file will appear in the "Uploaded Files" list
- The system will extract text from the PDF
- Text will be converted to vectors and stored in Pinecone
- Then the chatbot can reference this content

### Step 5: Start Chatting
1. Click **"Chat"** button next to the chatbot
2. Now when you send messages, the chatbot will find relevant content from the uploaded PDFs and use it to generate responses

## Why This Happens

### Possible Causes:
1. **No documents uploaded** - Most common. Upload PDFs first.
2. **Upload failed silently** - Check browser console for errors
3. **Processing failed** - Check server logs for errors in vectorization
4. **Wrong namespace** - Rare, but namespace_id might not match

## Debugging Steps

### For Users:
1. **Check file upload**: After uploading, verify the file appears in the "Uploaded Files" table
2. **Check file size**: Very large PDFs might fail. Try with smaller files first.
3. **Try a different PDF**: Some PDFs might have issues with text extraction
4. **Clear browser cache**: Sometimes old data is cached

### For Developers:
1. **Check server logs** for vectorization errors:
   ```
   Processing file: <filename>
   Successfully vectorized and stored documents
   ```

2. **Check Pinecone dashboard**:
   - Verify the index exists
   - Check if documents were actually stored in the namespace
   - Look for errors in vector storage

3. **Verify environment variables**:
   ```
   PINECONE_API_KEY - Should be set
   PINECONE_INDEX - Should match your index name
   MISTRAL_API_KEY - Should be set
   ```

4. **Test vectorization manually**:
   - Upload a file
   - Check the `./upload/[namespace_id]/uploaded-file/` directory
   - See if files are being created and processed

## Supported File Formats

Currently, the chatbot supports:
- ✅ **PDF files** - Recommended
- ✅ **Text files** (.txt)

## Best Practices

1. **Upload relevant documents** - The chatbot can only answer questions about uploaded content
2. **Use multiple documents** - Upload several PDFs for better coverage
3. **Use clear text** - Ensure PDFs have selectable text (not scanned images)
4. **Wait for processing** - Don't immediately chat after uploading, wait a moment
5. **Start with small files** - Test with a small PDF first

## Still Having Issues?

If you still see "No documents found" after uploading:
1. Check the server terminal for error messages
2. Look for errors like "Error processing file" or "Error vectorizing documents"
3. Try uploading a different PDF
4. Verify Pinecone credentials are correct in `.env` file
