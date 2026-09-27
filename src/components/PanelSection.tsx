import type { ReactNode } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// Medium blue header with black text: 7.35:1 contrast (WCAG AAA)
const HEADER_BG = '#5c9ce6'
const HEADER_BG_HOVER = '#74abeb'
const HEADER_BORDER = '1px solid #2b6cb0'

interface PanelSectionProps {
  title: string
  /** Whether the section starts expanded (default: collapsed) */
  defaultExpanded?: boolean
  children: ReactNode
}

/** A collapsible section of the controls panel. */
export function PanelSection({ title, defaultExpanded = false, children }: PanelSectionProps) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      square
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        // Replace the default divider line with the header's own borders
        '&::before': { display: 'none' },
        // Collapsed neighbors share one border line instead of stacking two
        '& + &': { mt: '-1px' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'common.black' }} />}
        sx={{
          bgcolor: HEADER_BG,
          color: 'common.black',
          borderTop: HEADER_BORDER,
          borderBottom: HEADER_BORDER,
          // Tighter than MUI's default 48px row with 12px content margins
          minHeight: 36,
          '& .MuiAccordionSummary-content': { my: 0.75 },
          '&:hover, &.Mui-focusVisible': { bgcolor: HEADER_BG_HOVER },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}
