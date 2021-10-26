import BigNumber from 'bignumber.js'
import { BlockEvent, Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from 'forta-agent'
import { CETHER_TOKEN_ADDRESS, ERC20_TRANSFER_EVENT_SIG } from './constants'

let ctokenBasicRate = new BigNumber(0.0020)

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {

    const findings: Finding[] = []
    const ethValue = new BigNumber(txEvent.transaction.value)

    if (txEvent.to !== CETHER_TOKEN_ADDRESS) return findings

    if (ethValue.isEqualTo(0)) return findings

    const [transferCetherEvent] = txEvent.filterEvent(ERC20_TRANSFER_EVENT_SIG, CETHER_TOKEN_ADDRESS)
    const cethValue = new BigNumber(transferCetherEvent.data)
    const cTokenCurrentRate = ethValue.dividedBy(cethValue).multipliedBy(10000000000000000)

    if (cTokenCurrentRate.isLessThan(ctokenBasicRate)) {
        findings.push(Finding.fromObject({
            name: "cToken exchange rate",
            description: `cToken exchange rate decreased`,
            alertId: "COMPOUND-4",
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            metadata: {
                ctokenCurrentExchangeRate: cTokenCurrentRate.toString(),
                ctokenPreviousExchangeRate: ctokenBasicRate.toString()
            }
        }))
    }

    ctokenBasicRate = new BigNumber(cTokenCurrentRate)

    return findings
}

export default {
  handleTransaction,
}
