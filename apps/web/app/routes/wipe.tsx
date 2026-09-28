import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';

/* ================= TYPES ================= */

interface FSItem {
  id: string;
  name: string;
  path: string;
}

/* ================= COMPONENT ================= */

const WipeApp = () => {
  const { auth, isLoading, error, fs, kv } = usePuterStore();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FSItem[]>([]);
  const [deleting, setDeleting] = useState(false);

  /* ================= LOAD FILES ================= */

  const loadFiles = async () => {
    try {
      const data = (await fs.readDir('./')) as FSItem[];
      setFiles(data || []);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate('/auth?next=/wipe');
    }
  }, [isLoading, auth.isAuthenticated, navigate]);

  /* ================= DELETE FUNCTION ================= */

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Delete all files
      await Promise.all(files.map((file) => fs.delete(file.path)));

      // Clear KV storage
      await kv.flush();

      // Reload files
      await loadFiles();

      // Optional: redirect to home
      navigate('/');
    } catch (err) {
      console.error('Error wiping data:', err);
    } finally {
      setDeleting(false);
    }
  };

  /* ================= STATES ================= */

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  /* ================= UI ================= */

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* USER INFO */}
      <div className="text-lg">
        Authenticated as:{' '}
        <span className="font-semibold">{auth.user?.username}</span>
      </div>

      {/* FILE LIST */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Files</h2>

        {files.length === 0 ? (
          <p className="text-gray-500">No files found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <p>{file.name}</p>
                <span className="text-sm text-gray-400">{file.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BUTTON */}
      <div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          {deleting ? 'Deleting...' : 'Wipe App Data'}
        </button>
      </div>
    </div>
  );
};

export default WipeApp;
