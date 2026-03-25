import { useState } from 'react';
import type { FormEvent } from 'react';

import Navbar from '~/components/Navbar';
import FileUploader from '~/components/FileUploader';
import { usePuterStore } from '~/lib/puter';
import { useNavigate } from 'react-router';
import { generateUUID } from '~/lib/utils';
import { prepareInstructions, AIResponseFormat } from '~/constants';

const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // ✅ File select
  const handleFileSelect = (file: File | null) => {
    console.log('📂 Selected File:', file);
    setFile(file);
  };

  // 🚀 MAIN FUNCTION (NO PDF conversion now)
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

      // 1️⃣ Upload file
      setStatusText('Uploading file...');
      const uploadedFile = await fs.upload([file]);

      console.log('📤 Uploaded File:', uploadedFile);

      if (!uploadedFile) throw new Error('Upload failed');

      // 2️⃣ Save initial data
      const uuid = generateUUID();

      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: '',
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 3️⃣ AI Analysis
      setStatusText('Analyzing with AI...');

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
          AIResponseFormat, // ✅ IMPORTANT FIX
        }),
      );

      console.log('🤖 AI RAW:', feedback);

      if (!feedback) throw new Error('AI failed');

      const feedbackText =
        typeof feedback.message.content === 'string'
          ? feedback.message.content
          : feedback.message.content[0]?.text;

      console.log('🧠 AI TEXT:', feedbackText);

      if (!feedbackText) throw new Error('Invalid AI response');

      // 4️⃣ Parse JSON
      try {
        data.feedback = JSON.parse(feedbackText);
      } catch {
        console.error('❌ Invalid JSON:', feedbackText);
        throw new Error('AI returned invalid JSON');
      }

      // 5️⃣ Save final data
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      console.log('✅ FINAL DATA:', data);

      setStatusText('Done! Redirecting...');

      // 6️⃣ Redirect
      setTimeout(() => {
        navigate(`/resume/${uuid}`);
      }, 1500);
    } catch (error: any) {
      console.error('🔥 ERROR:', error);
      setStatusText(error.message);
      setIsProcessing(false);
    }
  };

  // 🧾 Submit
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert('Upload a file first');
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
      file,
    });

    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };

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
                className="w-full max-w-md mx-auto"
              />
            </>
          ) : (
            <>
              <h2>Drop your resume for ATS score</h2>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mt-8"
              >
                <input name="company-name" placeholder="Google" />
                <input name="job-title" placeholder="Frontend Developer" />
                <textarea
                  name="job-description"
                  placeholder="Job description"
                />

                <FileUploader onFileSelect={handleFileSelect} />

                <button type="submit" className="primary-button">
                  Analyze 🚀
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
