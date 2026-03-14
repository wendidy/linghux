import React from 'react'
import { priceLabel } from '../utils/stripePrices'

export default function PriceText({
  priceId,
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
        priceId,
        price,
        loading,
        missingLabel,
        loadingLabel,
        unavailableLabel,
      })}
    </span>
  )
}
