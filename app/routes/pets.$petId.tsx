import { useParams } from "react-router";

export default function PetDetailsPage() {
  const { petId } = useParams();
  return (
    <div>
      <h1>Pet Details Page</h1>
      <p>Pet ID: {petId}</p>
    </div>
  );
}
