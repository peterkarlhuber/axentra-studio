import type { ComponentType } from 'react';
import {
  ArchitectureDiagram,
  HierarchyDiagram,
  JobLifecycleDiagram,
  KeyRotationDiagram,
  WebhookDeliveryDiagram,
} from './Diagrams';

/** Diagram names usable in articles as a ```diagram block (see docs/HELP_AUTHORING.md). */
export const DIAGRAMS = {
  architecture: ArchitectureDiagram,
  hierarchy: HierarchyDiagram,
  'job-lifecycle': JobLifecycleDiagram,
  'webhook-delivery': WebhookDeliveryDiagram,
  'key-rotation': KeyRotationDiagram,
} satisfies Record<string, ComponentType>;

export type DiagramName = keyof typeof DIAGRAMS;

export function isDiagramName(value: string): value is DiagramName {
  return Object.prototype.hasOwnProperty.call(DIAGRAMS, value);
}
