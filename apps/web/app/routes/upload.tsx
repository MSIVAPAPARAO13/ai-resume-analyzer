import { type FormEvent, useState } from 'react';
import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { convertPdfToImage } from '~/lib/pdf2img';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions } from '../constants';

const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // 📁 File select
  const handleFileSelect = (file: File | null) => {
    console.log('📂 Selected File:', file);
    setFile(file);
  };

  // 🚀 Main function
  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);

      // 1️⃣ Upload PDF
      setStatusText('Uploading the file...');
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) throw new Error('Upload failed');

      console.log('📤 Uploaded File:', uploadedFile);

      // 2️⃣ Convert PDF → Image
      setStatusText('Converting to image...');
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) throw new Error('PDF conversion failed');

      // 3️⃣ Upload Image
      setStatusText('Uploading the image...');
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) throw new Error('Image upload failed');

      // 4️⃣ Save initial data
      setStatusText('Preparing data...');
      const uuid = generateUUID();

      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 5️⃣ AI Analysis
      setStatusText('Analyzing...');
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription }),
      );

      if (!feedback) throw new Error('AI failed');

      console.log('🤖 AI RAW:', feedback);

      // 6️⃣ Extract text
      const feedbackText =
        typeof feedback.message.content === 'string'
          ? feedback.message.content
          : feedback.message.content[0]?.text;

      if (!feedbackText) throw new Error('Invalid AI response');

      console.log('🧠 AI TEXT:', feedbackText);

      // 7️⃣ Parse JSON
      data.feedback = JSON.parse(feedbackText);

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      console.log('✅ FINAL DATA:', data);

      // 8️⃣ Redirect
      setStatusText('Analysis complete!');
      navigate(`/resume/${uuid}`);
    } catch (error: any) {
      console.error('❌ ERROR:', error);
      setStatusText(error.message);
      setIsProcessing(false);
    }
  };

  // 🧾 Form submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Please upload a resume');
      return;
    }

    const formData = new FormData(e.currentTarget);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    console.log('📝 FORM DATA:', {
      companyName,
      jobTitle,
      jobDescription,
    });

    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };

  // 🎨 UI
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-full max-w-md mx-auto mt-6"
              />
            </>
          ) : (
            <>
              <h2>Drop your resume for ATS score & improvement tips</h2>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mt-8"
              >
                <div className="form-div">
                  <label>Company Name</label>
                  <input name="company-name" placeholder="Google" />
                </div>

                <div className="form-div">
                  <label>Job Title</label>
                  <input name="job-title" placeholder="Frontend Developer" />
                </div>

                <div className="form-div">
                  <label>Job Description</label>
                  <textarea
                    rows={5}
                    name="job-description"
                    placeholder="Paste job description..."
                  />
                </div>

                <div className="form-div">
                  <label>Upload Resume</label>
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>

                <button className="primary-button" type="submit">
                  Analyze Resume 🚀
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
