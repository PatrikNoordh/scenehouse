import { useParams } from "react-router";

export default function DetailPage() {
  const { id } = useParams();

  return (
    <section>
      <h1>Movie Detail</h1>
      <p>Details for movie {id} will appear here.</p>
    </section>
  );
}
