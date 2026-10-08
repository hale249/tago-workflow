export type FormType = "BASIC" | "SUBSCRIPTION" | "SURVEY"
export type FormFieldType = "text" | "textarea" | "number" | "email" | "date" | "datetime" | "select" | "checkbox"
export type FormField = { type: FormFieldType; label: string; name: string; required?: boolean; placeholder?: string; defaultValue?: string; options?: { value: string; text: string }[] }
/** Mirrors the reference API: config = { title, fields, submitButton: { text } }. */
export type FormConfig = { title: string; fields: FormField[]; submitButton: { text: string } }
export type WorkflowForm = { id: string; name: string; formType: FormType; description: string; config: FormConfig; formLink: string; formEmbedCode: string; createdAt: string; updatedAt: string }
