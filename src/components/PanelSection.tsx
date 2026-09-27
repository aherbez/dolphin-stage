import type { ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

/** A collapsible section of the controls panel, open by default. */
export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Accordion defaultExpanded disableGutters square elevation={0} sx={{ bgcolor: 'transparent' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}
