import { priceLabel } from '../utils/stripePrices'

export default function PriceText({
  itemId,
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
        itemId,
        price,
        loading,
        missingLabel,
        loadingLabel,
        unavailableLabel,
      })}
    </span>
  )
}
