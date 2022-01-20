import { task } from 'hardhat/config';

import { eContractid, eEthereumNetwork, tEthereumAddress } from '../../helpers/types';
import { registerContractInJsonDb } from '../../helpers/contracts-helpers';
import {
  getAaveAdminPerNetwork,
  getDistributionDurationPerNetwork,
  getExtraPsmRewardPerNetwork,
  getAaveIncentivesVaultPerNetwork,
} from '../../helpers/constants';
import {
  getStakedAaveProxy,
  deployInitializableAdminUpgradeabilityProxy,
  deployAaveIncentivesController,
} from '../../helpers/contracts-accessors';
import { checkVerification } from '../../helpers/etherscan-verification';

const { AaveIncentivesController, AaveIncentivesControllerImpl } = eContractid;

task(`deploy-${AaveIncentivesController}`, `Deploys the ${AaveIncentivesController} contract`)
  .addFlag('verify', 'Verify AaveIncentivesController contract via Etherscan API.')
  .addOptionalParam(
    'vaultAddress',
    'Use AaveIncentivesVault address by param instead of configuration.'
  )
  .addOptionalParam('stkAaveAddress', 'Use stkAaveToken address by param instead of configuration.')
  .setAction(async ({ verify, vaultAddress, stkAaveAddress }, localBRE) => {
    await localBRE.run('set-dre');

    // If Etherscan verification is enabled, check needed enviroments to prevent loss of gas in failed deployments.
    if (verify) {
      checkVerification();
    }

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }

    const network = localBRE.network.name as eEthereumNetwork;

    console.log(`\n- ${AaveIncentivesController} deployment`);

    console.log(`\tDeploying ${AaveIncentivesController} implementation ...`);
    const aaveIncentivesControllerImpl = await deployAaveIncentivesController(
      [
        stkAaveAddress || (await getStakedAaveProxy()).address,
        vaultAddress || getAaveIncentivesVaultPerNetwork(network),
        stkAaveAddress || (await getStakedAaveProxy()).address,
        getExtraPsmRewardPerNetwork(network),
        getAaveAdminPerNetwork(network),
        getDistributionDurationPerNetwork(network),
      ],
      false
    );
    console.log('deploy AaveIncentivesController successful');
    await aaveIncentivesControllerImpl.deployTransaction.wait();
    await registerContractInJsonDb(AaveIncentivesControllerImpl, aaveIncentivesControllerImpl);

    console.log(`\tDeploying ${AaveIncentivesController} Transparent Proxy ...`);
    const aaveIncentivesControllerProxy = await deployInitializableAdminUpgradeabilityProxy(verify);
    await registerContractInJsonDb(AaveIncentivesController, aaveIncentivesControllerProxy);

    console.log(`\tFinished ${AaveIncentivesController} proxy and implementation deployment`);
  });
