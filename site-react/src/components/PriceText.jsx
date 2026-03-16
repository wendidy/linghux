import React from 'react'
import { priceLabel } from '../utils/stripePrices'

export default function PriceText({
  lookupKey,
  price,
  loading,
  className,
  missingLabel,
  loadingLabel,
  unavailableLabel,
}) {
  return (
    <span className={className}>
      {priceLabel({
        lookupKey,
        price,
        loading,
        missingLabel,
        loadingLabel,
        unavailableLabel,
      })}
    </span>
  )
}
