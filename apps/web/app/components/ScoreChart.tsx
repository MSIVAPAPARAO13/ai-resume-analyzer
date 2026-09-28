import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const ScoreChart = ({ data }: any) => {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold mb-2">Score Trends</h2>

      <LineChart width={500} height={250} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line dataKey="score" />
      </LineChart>
    </div>
  );
};

export default ScoreChart;
