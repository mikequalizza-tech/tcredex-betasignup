import { useEffect, useState } from "react";

interface IntakeField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface IntakeFieldsData {
  fields: IntakeField[];
}

const INTAKE_API = "/api/intake/fields";

export function useIntakeFields() {
  const [fields, setFields] = useState<IntakeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchFields() {
      setLoading(true);
      try {
        const res = await fetch(INTAKE_API, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch intake fields");
        const data: IntakeFieldsData = await res.json();
        if (!ignore) {
          setFields(data.fields || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchFields();
    return () => {
      ignore = true;
    };
  }, []);

  return { fields, loading, error };
}
