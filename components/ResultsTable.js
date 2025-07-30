
export default function ResultsTable({ data }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Platform</th>
          <th>Value (AUD)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i}>
            <td>{item.name}</td>
            <td>{item.platform || '-'}</td>
            <td>{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
