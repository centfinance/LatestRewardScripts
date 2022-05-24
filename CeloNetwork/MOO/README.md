<h1 align=center><code>SYMM Mining</code></h1>

Set of scripts to calculate weekly SYMM liquidity mining distributions

## Requirements

An archive node is needed to run the scripts because historical balance snapshots are needed. A "starting-point" archive node can also be used that will only archive at x block onwards. Note this still probably requires 750G+ of disk space.

## Usage

```
node index.js --week 1 --startBlock 10176690 --endBlock 10221761
node index.js --week 2 --startBlock 10221761 --endBlock 10267003
```

This will run run all historical calculations by block. Using an infura endpoint this may take upwards of 18 hours. For a local archive node, the sync time is roughly 10 minutes. Progress bars with estimates are shown during the sync. Reports will be saved in the folder for the given week specified

```
node sum.js --week 1 --startBlock 10176690 --endBlock 10221761
```

After all reports are generated, `sum.js` will create a final tally of user address to SYMM received. This is stored in the report week folder at `_totals.json`

## Weekly distributions

We presently calculate daily but distribute weekly and so daily runs are being stored within weekly directories. This will likely change to a continuous daily cycle without having to combine weekly.

## SYMM Redirections

In case smart contracts which cannot receive SYMM tokens are specified, owners of those smart contracts can choose to redirect SYMM tokens to a new address. In order to submit a redirection request, submit a pull request to update `redirect.json` using `"fromAddress" : "toAddress"` along with some sort of ownership proof. Please reach out to the Balancer team if you need assistance.
