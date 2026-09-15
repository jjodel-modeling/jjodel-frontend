/**
 * FormExample - Demonstrates complete form using UI component library
 *
 * This example shows how to use:
 * - FormSection for layout
 * - Field for wrapping inputs with labels/help/errors
 * - Input, Select, Textarea for form inputs
 * - Toggle for boolean switches
 * - Button for actions (OUTLINE STYLE ONLY)
 */

import React, { useState } from 'react';
import {
  FormSection,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
  Button,
} from '../index';

export const FormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dependencies: '',
    readOnly: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // console.log('Form submitted:', formData);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', padding: '24px' }}>
      <FormSection title="DETAILS" divider>
        <Field
          label="Name"
          htmlFor="name"
          required
          error={errors.name}
          helpText="Must be unique. Used as identifier in code generation."
        >
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter model name"
            error={errors.name}
            fullWidth
          />
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
            showCharCount
            maxLength={500}
            fullWidth
          />
        </Field>

        <Field
          label="Model Dependencies"
          htmlFor="dependencies"
          helpText="This model will import types from selected models"
        >
          <Select
            id="dependencies"
            value={formData.dependencies}
            onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
            options={[
              { value: 'model1', label: 'Model 1' },
              { value: 'model2', label: 'Model 2' },
              { value: 'model3', label: 'Model 3' },
            ]}
            placeholder="Select dependent models..."
            fullWidth
          />
        </Field>

        <Toggle
          checked={formData.readOnly}
          onChange={(checked) => setFormData({ ...formData, readOnly: checked })}
          label="Read-only"
          description="Prevent modifications to this element"
        />
      </FormSection>

      <FormSection title="ACTIONS" divider>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>

          <Button
            variant="secondary"
            type="button"
            icon={<i className="bi bi-pencil" />}
          >
            Edit
          </Button>

          <Button
            variant="danger"
            type="button"
            icon={<i className="bi bi-trash" />}
          >
            Delete
          </Button>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-slate-500)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          <i className="bi bi-info-circle" style={{ marginTop: '2px', flexShrink: 0, fontSize: '14px' }} />
          These actions affect the selected element. Changes can be undone with Ctrl+Z.
        </p>
      </FormSection>
    </form>
  );
};

export default FormExample;
