import React from 'react'
import {Box} from '@mui/material'
import {HoparaCloudBadge} from './HoparaCloudBadge'

export const CloudFeatureLabel = ({featureName}: {featureName: string}) => (
  <Box sx={{textAlign: 'center'}}>
    <div>{featureName}</div>
    <Box sx={{opacity: 0.7, fontSize: 11, marginTop: '2px'}}>
      <HoparaCloudBadge />
    </Box>
  </Box>
)
